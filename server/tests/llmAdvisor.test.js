const test = require('node:test');
const assert = require('node:assert');
const {
  parseAndValidateLlmOutput,
  buildUserPrompt,
  generateLlmAdvice,
  callGroqAdvisor,
  callGeminiAdvisor,
  SYSTEM_PROMPT,
} = require('../src/services/llmAdvisor.service');

test('parseAndValidateLlmOutput correctly parses valid raw JSON', () => {
  const rawJson = JSON.stringify({
    executiveSummary: 'Strong candidate with deep frontend experience in React and TypeScript.',
    strengths: ['Expert in React and modern state management', 'Strong performance optimization background'],
    criticalGaps: ['Missing Evidence: No explicit mention of GraphQL', 'Skill Gap: Limited cloud containerization'],
    actionableRecommendations: [
      {
        section: 'Work Experience',
        currentObservation: 'Contains passive phrasing around feature delivery.',
        suggestedImprovement: 'Highlight leadership and quantify scale.',
        exampleRewrite: 'Engineered high-throughput checkout flow handling [15k+ daily users].',
      },
    ],
  });

  const parsed = parseAndValidateLlmOutput(rawJson);
  assert.strictEqual(parsed.executiveSummary, 'Strong candidate with deep frontend experience in React and TypeScript.');
  assert.strictEqual(parsed.strengths.length, 2);
  assert.strictEqual(parsed.criticalGaps.length, 2);
  assert.strictEqual(parsed.actionableRecommendations.length, 1);
  assert.strictEqual(parsed.actionableRecommendations[0].section, 'Work Experience');
  assert.strictEqual(parsed.actionableRecommendations[0].exampleRewrite, 'Engineered high-throughput checkout flow handling [15k+ daily users].');
});

test('parseAndValidateLlmOutput handles markdown-wrapped JSON code blocks', () => {
  const markdownWrapped = `
Here is the fit analysis evaluation:
\`\`\`json
{
  "executiveSummary": "Solid mid-level developer matching 75% of technical requirements.",
  "strengths": ["Demonstrates robust TypeScript skills"],
  "criticalGaps": ["No production experience with Kafka"],
  "actionableRecommendations": [
    {
      "section": "Technical Skills",
      "currentObservation": "Mentions queues in passing.",
      "suggestedImprovement": "Explicitly identify message broker concepts.",
      "exampleRewrite": "Architected event-driven microservices utilizing [RabbitMQ/Kafka] with [X ms] latency."
    }
  ]
}
\`\`\`
Hope this helps!
`;

  const parsed = parseAndValidateLlmOutput(markdownWrapped);
  assert.strictEqual(parsed.executiveSummary, 'Solid mid-level developer matching 75% of technical requirements.');
  assert.strictEqual(parsed.strengths[0], 'Demonstrates robust TypeScript skills');
  assert.strictEqual(parsed.criticalGaps[0], 'No production experience with Kafka');
  assert.strictEqual(parsed.actionableRecommendations.length, 1);
});

test('parseAndValidateLlmOutput throws on completely invalid non-JSON output', () => {
  assert.throws(() => {
    parseAndValidateLlmOutput('I am an AI and I cannot evaluate this resume.');
  }, /Failed to parse LLM response as JSON/);
});

test('buildUserPrompt properly incorporates resume, JD, and NLP signals', () => {
  const prompt = buildUserPrompt({
    resumeText: 'John Doe - Software Engineer with 5 years experience.',
    jobDescription: 'Seeking Senior Fullstack Engineer proficient in Go and Kubernetes.',
    matchScore: 78,
    detectedSkills: ['JavaScript', 'React', 'Docker'],
    missingSkills: ['Go', 'Kubernetes'],
    roleTitle: 'Senior Fullstack Engineer',
    company: 'Acme Cloud',
  });

  assert.match(prompt, /TARGET ROLE: Senior Fullstack Engineer/);
  assert.match(prompt, /TARGET COMPANY: Acme Cloud/);
  assert.match(prompt, /DETERMINISTIC ATS COMPATIBILITY SCORE: 78\/100/);
  assert.match(prompt, /JavaScript, React, Docker/);
  assert.match(prompt, /Go, Kubernetes/);
  assert.match(prompt, /John Doe - Software Engineer/);
  assert.match(prompt, /Seeking Senior Fullstack Engineer/);
});

test('SYSTEM_PROMPT includes strict factual accuracy and placeholder rules', () => {
  assert.match(SYSTEM_PROMPT, /NEVER invent achievements/i);
  assert.match(SYSTEM_PROMPT, /Missing Evidence/i);
  assert.match(SYSTEM_PROMPT, /Skill Gap/i);
  assert.match(SYSTEM_PROMPT, /bracketed placeholders/i);
  assert.match(SYSTEM_PROMPT, /transferable skills/i);
});

test('generateLlmAdvice returns null when resumeText or jobDescription is missing', async () => {
  const res1 = await generateLlmAdvice({ resumeText: '', jobDescription: 'Some JD' });
  assert.strictEqual(res1, null);

  const res2 = await generateLlmAdvice({ resumeText: 'Some Resume', jobDescription: '' });
  assert.strictEqual(res2, null);
});

test('generateLlmAdvice returns null gracefully when neither API key is configured', async () => {
  const prevGroq = process.env.GROQ_API_KEY;
  const prevGemini = process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.GROK_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await generateLlmAdvice({
      resumeText: 'Candidate with experience in React and Node.js.',
      jobDescription: 'Looking for a React developer.',
      matchScore: 85,
    });

    assert.strictEqual(result, null);
  } finally {
    if (prevGroq) process.env.GROQ_API_KEY = prevGroq;
    if (prevGemini) process.env.GEMINI_API_KEY = prevGemini;
  }
});

test('generateLlmAdvice successfully executes Groq provider when mock response is returned', async () => {
  const prevGroq = process.env.GROQ_API_KEY;
  const prevFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = 'test_groq_key_mock_12345';

  try {
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://api.groq.com/openai/v1/chat/completions');
      assert.strictEqual(options.headers.Authorization, 'Bearer test_groq_key_mock_12345');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  executiveSummary: 'Groq executive evaluation: strong match for core engineering.',
                  strengths: ['Deep expertise in Node.js microservices'],
                  criticalGaps: ['Missing Evidence: AWS infrastructure experience'],
                  actionableRecommendations: [
                    {
                      section: 'Work Experience',
                      currentObservation: 'Lacks cloud metrics.',
                      suggestedImprovement: 'Detail cloud deployment scope.',
                      exampleRewrite: 'Deployed scalable services supporting [N users].',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      };
    };

    const result = await generateLlmAdvice({
      resumeText: 'Node.js developer with 4 years experience building APIs.',
      jobDescription: 'Backend Engineer needed with Node.js and AWS.',
      matchScore: 82,
      detectedSkills: ['Node.js'],
      missingSkills: ['AWS'],
    });

    assert.ok(result);
    assert.strictEqual(result.providerUsed, 'groq');
    assert.strictEqual(result.modelUsed, 'openai/gpt-oss-20b');
    assert.match(result.executiveSummary, /Groq executive evaluation/);
    assert.strictEqual(result.strengths[0], 'Deep expertise in Node.js microservices');
    assert.strictEqual(result.criticalGaps[0], 'Missing Evidence: AWS infrastructure experience');
  } finally {
    globalThis.fetch = prevFetch;
    if (prevGroq) {
      process.env.GROQ_API_KEY = prevGroq;
    } else {
      delete process.env.GROQ_API_KEY;
    }
  }
});

test('generateLlmAdvice automatically falls back to Gemini if Groq fails or times out', async () => {
  const prevGroq = process.env.GROQ_API_KEY;
  const prevGemini = process.env.GEMINI_API_KEY;
  const prevFetch = globalThis.fetch;

  process.env.GROQ_API_KEY = 'failing_groq_key';
  process.env.GEMINI_API_KEY = 'working_gemini_key';

  try {
    let groqAttempted = false;
    let geminiAttempted = false;

    globalThis.fetch = async (url, options) => {
      if (url.includes('api.groq.com')) {
        groqAttempted = true;
        // Simulate Groq 500 error or rate limit
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: { message: 'Groq service unavailable' } }),
        };
      }

      if (url.includes('generativelanguage.googleapis.com')) {
        geminiAttempted = true;
        const hasKey = url.includes('key=working_gemini_key') || options?.headers?.['x-goog-api-key'] === 'working_gemini_key';
        assert.ok(hasKey);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        executiveSummary: 'Gemini fallback evaluation: excellent technical alignment.',
                        strengths: ['Comprehensive React state management'],
                        criticalGaps: ['Missing Evidence: Unit testing depth'],
                        actionableRecommendations: [
                          {
                            section: 'Projects',
                            currentObservation: 'Projects do not mention testing tools.',
                            suggestedImprovement: 'List testing suites.',
                            exampleRewrite: 'Authored integration tests using [Vitest] achieving [X%] coverage.',
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    };

    const result = await generateLlmAdvice({
      resumeText: 'Frontend Engineer skilled in React and CSS.',
      jobDescription: 'Looking for React engineer.',
      matchScore: 80,
    });

    assert.strictEqual(groqAttempted, true, 'Groq should have been attempted first');
    assert.strictEqual(geminiAttempted, true, 'Gemini should have been attempted as fallback');
    assert.ok(result);
    assert.strictEqual(result.providerUsed, 'gemini');
    assert.match(result.executiveSummary, /Gemini fallback evaluation/);
    assert.strictEqual(result.strengths[0], 'Comprehensive React state management');
  } finally {
    globalThis.fetch = prevFetch;
    if (prevGroq) process.env.GROQ_API_KEY = prevGroq; else delete process.env.GROQ_API_KEY;
    if (prevGemini) process.env.GEMINI_API_KEY = prevGemini; else delete process.env.GEMINI_API_KEY;
  }
});

test('generateLlmAdvice returns null without throwing when both Groq and Gemini fail', async () => {
  const prevGroq = process.env.GROQ_API_KEY;
  const prevGemini = process.env.GEMINI_API_KEY;
  const prevFetch = globalThis.fetch;

  process.env.GROQ_API_KEY = 'failing_groq_key';
  process.env.GEMINI_API_KEY = 'failing_gemini_key';

  try {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: { message: 'Provider down' } }),
      };
    };

    const result = await generateLlmAdvice({
      resumeText: 'Developer resume text.',
      jobDescription: 'Target job description.',
      matchScore: 75,
    });

    assert.strictEqual(result, null, 'Should return null gracefully without throwing an exception');
  } finally {
    globalThis.fetch = prevFetch;
    if (prevGroq) process.env.GROQ_API_KEY = prevGroq; else delete process.env.GROQ_API_KEY;
    if (prevGemini) process.env.GEMINI_API_KEY = prevGemini; else delete process.env.GEMINI_API_KEY;
  }
});
