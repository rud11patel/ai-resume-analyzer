/**
 * LLM Resume Advisor Service
 * 
 * Provides personalized, contextual resume evaluations against target job descriptions
 * using Groq (LPU Inference) as the primary provider with automatic fallback to Google Gemini.
 * 
 * Adheres strictly to factual grounding rules: never fabricates metrics, achievements,
 * or credentials, uses explicit candidate placeholders for missing quantitative impact,
 * explains transferable skills, and distinguishes missing evidence from confirmed skill gaps.
 */

const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '25000', 10);

const SYSTEM_PROMPT = `You are an expert ATS auditor, senior engineering hiring manager, and executive technical recruiter.
Your objective is to provide a rigorous, objective, and deeply actionable evaluation of a candidate's resume against a target job posting.

CRITICAL ACCURACY AND GROUNDING RULES:
1. Ground all observations strictly in the provided candidate resume text and job description.
2. NEVER invent achievements, metrics, companies, credentials, degrees, or work history that the candidate did not explicitly state.
3. Distinguish clearly between:
   - "Missing Evidence": Requirements not explicitly mentioned in the resume text, but where candidate has relevant transferable foundation.
   - "Skill Gap": Clear deficiencies where the candidate lacks required foundational knowledge or seniority.
4. For recommendations requiring quantitative impact where the candidate provided no numbers, use clearly labeled bracketed placeholders such as "[quantify: e.g., reduced API latency by X% or supported N concurrent users]".
5. Highlight transferable skills constructively (e.g., PostgreSQL expertise transferring to MySQL, or Express.js transferring to NestJS).
6. Output MUST be valid, parseable JSON conforming strictly to the requested schema. Do not enclose the output in Markdown code blocks (\`\`\`json). Output raw JSON only.`;

/**
 * Builds the user prompt injecting resume text, job description, and pre-computed NLP signals.
 * Sanitizes and caps lengths to protect against token rate limits on fast inference providers.
 */
function buildUserPrompt({
  resumeText = '',
  jobDescription = '',
  matchScore,
  detectedSkills = [],
  missingSkills = [],
  roleTitle,
  company,
}) {
  const detectedList = Array.isArray(detectedSkills) && detectedSkills.length > 0
    ? detectedSkills.slice(0, 35).join(', ')
    : 'None explicitly detected';

  const missingList = Array.isArray(missingSkills) && missingSkills.length > 0
    ? missingSkills.slice(0, 35).join(', ')
    : 'None identified';

  // Cap prompt texts to avoid hitting per-minute token quotas
  const cleanResume = resumeText.trim().slice(0, 7500);
  const cleanJd = jobDescription.trim().slice(0, 3500);

  return `TARGET ROLE: ${roleTitle || 'Target Position'}
TARGET COMPANY: ${company || 'Target Organization'}
DETERMINISTIC ATS COMPATIBILITY SCORE: ${typeof matchScore === 'number' ? matchScore : 'N/A'}/100

NLP ENGINE DETECTED MATCHED SKILLS:
${detectedList}

NLP ENGINE DETECTED MISSING SKILLS / KEYWORDS:
${missingList}

--- TARGET JOB DESCRIPTION ---
${cleanJd}

--- CANDIDATE RESUME TEXT ---
${cleanResume}

--- INSTRUCTIONS ---
Perform a comprehensive fit analysis. Return a JSON object with EXACTLY this structure:
{
  "executiveSummary": "A concise 2-4 sentence executive overview assessing overall candidate-job fit, seniority alignment, and primary value proposition.",
  "strengths": [
    "Relevant skill or concrete achievement from the resume that directly aligns with the role."
  ],
  "criticalGaps": [
    "Missing skill, experience depth, or domain knowledge required by the job posting, distinguishing between missing resume evidence vs hard gap."
  ],
  "actionableRecommendations": [
    {
      "section": "Name of resume section (e.g., 'Work Experience', 'Technical Skills', 'Projects', 'Professional Summary')",
      "currentObservation": "Specific observation of what is currently written or lacking in the candidate resume.",
      "suggestedImprovement": "Concrete, actionable advice on how to improve this section to match the job requirements.",
      "exampleRewrite": "Exact example rewrite of a bullet point or statement with explicit candidate metric placeholders like [X% metric]."
    }
  ]
}`;
}

/**
 * Cleans and safely parses raw LLM output into validated JSON.
 * Robust against leading/trailing conversational text and Markdown backticks.
 * 
 * @param {string} rawText
 * @returns {object} Validated LLM feedback object
 */
function parseAndValidateLlmOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('LLM returned empty or non-string response.');
  }

  // Strip Markdown code block wrappers if present
  let cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // Extract JSON payload bounded by outermost curly braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    throw new Error(`Failed to parse LLM response as JSON: ${parseErr.message}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed LLM output is not an object.');
  }

  // Normalize executiveSummary
  const executiveSummary = typeof parsed.executiveSummary === 'string' && parsed.executiveSummary.trim().length > 0
    ? parsed.executiveSummary.trim()
    : 'Candidate evaluation completed against target job requirements.';

  // Normalize strengths array
  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter((s) => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
    : [];

  // Normalize criticalGaps array
  const criticalGaps = Array.isArray(parsed.criticalGaps)
    ? parsed.criticalGaps.filter((g) => typeof g === 'string' && g.trim().length > 0).map((g) => g.trim())
    : [];

  // Normalize actionableRecommendations array
  const actionableRecommendations = Array.isArray(parsed.actionableRecommendations)
    ? parsed.actionableRecommendations
        .filter((r) => r && typeof r === 'object')
        .map((rec) => ({
          section: typeof rec.section === 'string' && rec.section.trim() ? rec.section.trim() : 'Resume Alignment',
          currentObservation: typeof rec.currentObservation === 'string' && rec.currentObservation.trim()
            ? rec.currentObservation.trim()
            : 'Opportunity to strengthen alignment with target job posting.',
          suggestedImprovement: typeof rec.suggestedImprovement === 'string' && rec.suggestedImprovement.trim()
            ? rec.suggestedImprovement.trim()
            : 'Refine phrasing to incorporate target skills and measurable accomplishments.',
          exampleRewrite: typeof rec.exampleRewrite === 'string' && rec.exampleRewrite.trim()
            ? rec.exampleRewrite.trim()
            : '[Quantified achievement e.g., improved system throughput by X% using relevant tech stack].',
        }))
    : [];

  return {
    executiveSummary,
    strengths,
    criticalGaps,
    actionableRecommendations,
  };
}

/**
 * Primary Provider: Groq API (High-speed LPU Inference)
 * Uses OpenAI-compatible chat completions endpoint.
 * Optimized with low reasoning effort and token bounds for sub-second responses.
 * 
 * @param {object} params
 * @returns {Promise<object>}
 */
async function callGroqAdvisor({
  resumeText,
  jobDescription,
  matchScore,
  detectedSkills,
  missingSkills,
  roleTitle,
  company,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const model = process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL;
  const userPrompt = buildUserPrompt({
    resumeText,
    jobDescription,
    matchScore,
    detectedSkills,
    missingSkills,
    roleTitle,
    company,
  });

  const groqTimeout = Math.min(timeoutMs, 20000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), groqTimeout);

  const requestBody = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
    max_completion_tokens: 2048,
  };

  // Optimize reasoning models like openai/gpt-oss-20b for fast response and minimal token overhead
  if (model.includes('gpt-oss') || model.includes('o1') || model.includes('o3')) {
    requestBody.reasoning_effort = 'low';
  }

  try {
    const startTime = Date.now();
    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // Quick retry once on 429 rate limit or 503 capacity
    if (response.status === 429 || response.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(`Groq API error (${response.status}): ${errMsg}`);
    }

    const rawContent = data?.choices?.[0]?.message?.content || data?.output_text;
    if (!rawContent) {
      throw new Error('Groq returned an empty response body.');
    }

    const validated = parseAndValidateLlmOutput(rawContent);
    const duration = Date.now() - startTime;
    console.info(`[LLM Advisor] Groq (${model}) completed in ${duration}ms.`);

    return {
      ...validated,
      providerUsed: 'groq',
      modelUsed: model,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Groq API request timed out after ${groqTimeout}ms.`);
    }
    throw err;
  }
}

/**
 * Fallback Provider: Google Gemini API
 * Supports both Google's Interactions API and generateContent with automatic retry on 503.
 * 
 * @param {object} params
 * @returns {Promise<object>}
 */
async function callGeminiAdvisor({
  resumeText,
  jobDescription,
  matchScore,
  detectedSkills,
  missingSkills,
  roleTitle,
  company,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const userPrompt = buildUserPrompt({
    resumeText,
    jobDescription,
    matchScore,
    detectedSkills,
    missingSkills,
    roleTitle,
    company,
  });

  const geminiTimeout = Math.min(timeoutMs, 25000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), geminiTimeout);

  const fullPromptText = `${SYSTEM_PROMPT}\n\n${userPrompt}\n\nIMPORTANT: Return ONLY valid, parseable JSON conforming strictly to the requested schema.`;

  try {
    const startTime = Date.now();
    let rawContent = null;

    // 1. First attempt: Modern Interactions API (standard for gemini-3.8-flash)
    try {
      let intResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          input: fullPromptText,
        }),
        signal: controller.signal,
      });

      // If 503 demand spike, wait 1.5s and retry once
      if (intResponse.status === 503) {
        await new Promise((res) => setTimeout(res, 1500));
        intResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            model,
            input: fullPromptText,
          }),
          signal: controller.signal,
        });
      }

      if (intResponse.ok) {
        const intData = await intResponse.json().catch(() => null);
        rawContent = intData?.output_text
          || intData?.steps?.[intData.steps.length - 1]?.content?.[0]?.text
          || (typeof intData?.output === 'string' ? intData.output : null);
      }
    } catch (intErr) {
      // Continue to generateContent fallback
    }

    // 2. Second attempt: generateContent endpoint if Interactions did not produce content
    if (!rawContent) {
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      let genResponse = await fetch(genUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPromptText }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      if (genResponse.status === 503) {
        await new Promise((res) => setTimeout(res, 1500));
        genResponse = await fetch(genUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: fullPromptText }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
        });
      }

      const genData = await genResponse.json().catch(() => null);
      if (!genResponse.ok) {
        const errMsg = genData?.error?.message || `HTTP ${genResponse.status} ${genResponse.statusText}`;
        throw new Error(`Google Gemini API error (${genResponse.status}): ${errMsg}`);
      }

      rawContent = genData?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    clearTimeout(timeoutId);

    if (!rawContent) {
      throw new Error('Google Gemini returned an empty response body.');
    }

    const validated = parseAndValidateLlmOutput(rawContent);
    const duration = Date.now() - startTime;
    console.info(`[LLM Advisor] Gemini (${model}) completed in ${duration}ms.`);

    return {
      ...validated,
      providerUsed: 'gemini',
      modelUsed: model,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Google Gemini API request timed out after ${geminiTimeout}ms.`);
    }
    throw err;
  }
}

/**
 * Orchestrates LLM career advisor evaluation with automatic provider fallback:
 * 1. Attempts Groq API (Primary)
 * 2. If Groq fails or is unconfigured, attempts Google Gemini API (Fallback)
 * 3. If both providers fail or neither key is set, returns null gracefully
 * 
 * Never throws to the caller: failures are logged and the deterministic pipeline continues unaffected.
 * 
 * @param {object} params
 * @returns {Promise<object|null>} Structured LLM advice or null
 */
async function generateLlmAdvice(params) {
  const { resumeText, jobDescription } = params || {};
  if (!resumeText || !jobDescription) {
    return null;
  }

  const hasGroqKey = Boolean((process.env.GROQ_API_KEY || '').trim());
  const hasGeminiKey = Boolean((process.env.GEMINI_API_KEY || '').trim());

  let result = null;

  // Step 1: Try Primary Provider (Groq)
  if (hasGroqKey) {
    try {
      result = await callGroqAdvisor(params);
      if (result) return result;
    } catch (err) {
      console.warn(`[LLM Advisor] Primary provider (Groq) failed: ${err.message}. Initiating Gemini fallback...`);
    }
  } else {
    console.info('[LLM Advisor] GROQ_API_KEY is not set. Proceeding to Gemini fallback.');
  }

  // Step 2: Try Fallback Provider (Google Gemini)
  if (hasGeminiKey) {
    try {
      result = await callGeminiAdvisor(params);
      if (result) return result;
    } catch (geminiErr) {
      console.warn(`[LLM Advisor] Fallback provider (Gemini) failed: ${geminiErr.message}.`);
    }
  } else {
    console.info('[LLM Advisor] GEMINI_API_KEY is not set.');
  }

  // Step 3: Graceful degradation if both failed or no keys configured
  console.info('[LLM Advisor] LLM feedback skipped (no providers available or all failed). Deterministic analysis preserved.');
  return null;
}

module.exports = {
  generateLlmAdvice,
  callGroqAdvisor,
  callGrokAdvisor: callGroqAdvisor, // alias for backwards compatibility
  callGeminiAdvisor,
  parseAndValidateLlmOutput,
  buildUserPrompt,
  SYSTEM_PROMPT,
};
