const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const JobDescription = require('../src/models/JobDescription');
const AnalysisResult = require('../src/models/AnalysisResult');

test.before(async () => {
  await connectTestDB();
});

test.after(async () => {
  await closeTestDB();
});

test.beforeEach(async () => {
  await clearTestDB();
});

test('User model normalizes email to lowercase and strips passwordHash in toJSON', async () => {
  const user = await User.create({
    name: 'Taylor Swift',
    email: 'TAYLOR.SWIFT@EXAMPLE.COM',
    passwordHash: '$2a$10$fakehashforexampletestingpurposesonly',
  });

  assert.strictEqual(user.email, 'taylor.swift@example.com');
  const json = user.toJSON();
  assert.strictEqual(json.passwordHash, undefined);
  assert.strictEqual(json.__v, undefined);
  assert.strictEqual(json.name, 'Taylor Swift');
});

test('Resume model enforces required fields and fileType enum', async () => {
  const user = await User.create({
    name: 'Candidate A',
    email: 'candidate.a@example.com',
    passwordHash: 'hash123',
  });

  // Valid resume creation
  const resume = await Resume.create({
    userId: user._id,
    originalName: 'MyResume.pdf',
    fileName: 'resume-12345.pdf',
    filePath: 'uploads/resume-12345.pdf',
    fileType: 'application/pdf',
    fileSize: 104200,
  });

  assert.strictEqual(resume.extractionStatus, 'pending');
  assert.strictEqual(resume.originalName, 'MyResume.pdf');

  // Verify toJSON strips sensitive internal filesystem path
  const json = resume.toJSON();
  assert.strictEqual(json.filePath, undefined);

  // Invalid fileType enum throws validation error
  await assert.rejects(
    async () => {
      await Resume.create({
        userId: user._id,
        originalName: 'script.exe',
        fileName: 'resume-bad.exe',
        filePath: 'uploads/resume-bad.exe',
        fileType: 'application/x-msdownload',
        fileSize: 500,
      });
    },
    (err) => err.name === 'ValidationError'
  );
});

test('JobDescription model enforces min length on rawText', async () => {
  const user = await User.create({
    name: 'Candidate B',
    email: 'candidate.b@example.com',
    passwordHash: 'hash123',
  });

  // Short rawText should fail validation
  await assert.rejects(
    async () => {
      await JobDescription.create({
        userId: user._id,
        roleTitle: 'Engineer',
        rawText: 'Too short',
      });
    },
    (err) => err.name === 'ValidationError'
  );

  // Valid job description
  const jd = await JobDescription.create({
    userId: user._id,
    roleTitle: 'Senior React Developer',
    company: 'Acme Corp',
    rawText: 'We are seeking an experienced frontend developer to build responsive web applications with React 19.',
  });

  assert.strictEqual(jd.roleTitle, 'Senior React Developer');
  assert.strictEqual(jd.company, 'Acme Corp');
});

test('AnalysisResult model defaults to demo mode and validates references', async () => {
  const user = await User.create({
    name: 'Candidate C',
    email: 'candidate.c@example.com',
    passwordHash: 'hash123',
  });

  const resume = await Resume.create({
    userId: user._id,
    originalName: 'CV.docx',
    fileName: 'resume-cv.docx',
    filePath: 'uploads/resume-cv.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 55000,
  });

  const jd = await JobDescription.create({
    userId: user._id,
    roleTitle: 'Full Stack Engineer',
    rawText: 'Looking for Node.js and MongoDB engineer with at least 3 years experience building APIs.',
  });

  const analysis = await AnalysisResult.create({
    userId: user._id,
    resumeId: resume._id,
    jobDescriptionId: jd._id,
    status: 'completed',
    overallScore: 82,
    scoreLabel: 'Strong Match',
  });

  assert.strictEqual(analysis.isDemoData, true); // Explicitly identified as demo data until Phase 4
  assert.strictEqual(analysis.overallScore, 82);
  assert.strictEqual(analysis.status, 'completed');
});
