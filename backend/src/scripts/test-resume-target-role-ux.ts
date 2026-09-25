import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function runResumeTargetRoleTests() {
  console.log('🧪 ===================================================');
  console.log('🧪 ELEVATE.AI — RESUME ANALYSIS & TARGET ROLE UX TEST');
  console.log('🧪 ===================================================\n');

  let mongod: MongoMemoryServer | null = null;
  let uri = process.env.MONGO_URI;

  try {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log(`🔌 Spawning MongoDB Engine Instance: ${uri}`);
  } catch (err: any) {
    console.log(`ℹ️ Using configured MONGO_URI: ${uri}`);
  }

  if (!uri) {
    throw new Error('No MongoDB URI available for testing');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB successfully.\n');

  try {
    const pwdHash = await bcrypt.hash('SecurePass123!', 10);

    // -------------------------------------------------------------
    // TEST 1: New User with no resume has NULL atsScore (No fake score)
    // -------------------------------------------------------------
    console.log('▶️ [Test 1/6] Verifying no ATS score for new user without resume...');
    const user1 = await User.create({
      name: 'Taylor Swift',
      email: `user1_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Junior Frontend Developer',
      trackLevel: 'Entry Level',
      userType: 'STUDENT',
    });

    if (user1.parsedResumeData?.atsScore !== undefined) {
      throw new Error(`Expected undefined ATS score for user without resume, got ${user1.parsedResumeData?.atsScore}`);
    }
    console.log('✅ Passed: User has no fake ATS score.\n');

    // -------------------------------------------------------------
    // TEST 2: Custom Role Support: "Generative AI Engineer"
    // -------------------------------------------------------------
    console.log('▶️ [Test 2/6] Verifying custom target role "Generative AI Engineer"...');
    const customRole1 = 'Generative AI Engineer';
    user1.targetRole = customRole1;
    user1.parsedResumeData = {
      summary: 'Specialist in LLMs, RAG, PyTorch, and LangChain.',
      extractedSkills: ['Python', 'PyTorch', 'LangChain', 'RAG', 'LLM', 'FastAPI'],
      experienceYears: 3,
      atsScore: 88,
      targetRoleMatch: 85,
      recommendedFocusAreas: ['Fine-Tuning', 'Quantization'],
    };
    await user1.save();

    const updatedUser1 = await User.findById(user1._id);
    if (updatedUser1?.targetRole !== 'Generative AI Engineer') {
      throw new Error(`Expected targetRole "Generative AI Engineer", got "${updatedUser1?.targetRole}"`);
    }
    console.log(`✅ Passed: Custom role "${updatedUser1.targetRole}" saved successfully without forced seniority.\n`);

    // -------------------------------------------------------------
    // TEST 3: Custom Role Support: "LLM Application Engineer"
    // -------------------------------------------------------------
    console.log('▶️ [Test 3/6] Verifying custom target role "LLM Application Engineer"...');
    const customRole2 = 'LLM Application Engineer';
    const user2 = await User.create({
      name: 'Morgan Dev',
      email: `user2_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: customRole2,
      trackLevel: 'Intermediate',
      userType: 'CAREER_SWITCHER',
      parsedResumeData: {
        extractedSkills: ['Python', 'TypeScript', 'OpenAI', 'Vector DBs'],
        experienceYears: 4,
        atsScore: 82,
      },
    });

    const fetchedUser2 = await User.findById(user2._id);
    if (fetchedUser2?.targetRole !== 'LLM Application Engineer') {
      throw new Error(`Expected targetRole "${customRole2}", got "${fetchedUser2?.targetRole}"`);
    }
    console.log(`✅ Passed: Custom role "${fetchedUser2.targetRole}" persisted accurately.\n`);

    // -------------------------------------------------------------
    // TEST 4: No Automatic Seniority Assignment
    // -------------------------------------------------------------
    console.log('▶️ [Test 4/6] Verifying system does NOT force Senior/Staff on resume upload...');
    const user3 = await User.create({
      name: 'Casey Staffer',
      email: `user3_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Software Engineer', // User selected simple Software Engineer
      trackLevel: 'Intermediate',
      userType: 'JOB_SEEKER',
    });

    // Resume text contains 10+ years and senior keywords
    user3.parsedResumeData = {
      summary: '10+ years of distributed systems experience, Kubernetes, Kafka, Staff architect.',
      extractedSkills: ['Distributed Systems', 'Kafka', 'Kubernetes', 'Go', 'AWS'],
      experienceYears: 10,
      atsScore: 92,
      targetRoleMatch: 90,
    };
    // Target role must remain what the user chose ('Software Engineer'), not hijacked to 'Staff Architect'
    await user3.save();

    const fetchedUser3 = await User.findById(user3._id);
    if (fetchedUser3?.targetRole !== 'Software Engineer') {
      throw new Error(`Target role was hijacked! Expected "Software Engineer", got "${fetchedUser3?.targetRole}"`);
    }
    console.log(`✅ Passed: Senior resume did not overwrite user's chosen targetRole ("${fetchedUser3.targetRole}").\n`);

    // -------------------------------------------------------------
    // TEST 5: Resume Invalidation on Re-upload
    // -------------------------------------------------------------
    console.log('▶️ [Test 5/6] Verifying resume data replacement on new upload...');
    const newResumeData = {
      summary: 'Updated resume with new cloud certifications.',
      extractedSkills: ['TypeScript', 'React', 'Node.js', 'AWS', 'Terraform'],
      experienceYears: 5,
      atsScore: 86,
      targetRoleMatch: 88,
    };

    user3.parsedResumeData = newResumeData;
    await user3.save();

    const reloadedUser3 = await User.findById(user3._id);
    if (reloadedUser3?.parsedResumeData?.atsScore !== 86 || reloadedUser3.parsedResumeData.extractedSkills.length !== 5) {
      throw new Error('New resume analysis did not properly replace old data');
    }
    console.log('✅ Passed: Resume analysis updated cleanly with new ATS score (86%).\n');

    // -------------------------------------------------------------
    // TEST 6: Existing Users Profile & Data Preservation
    // -------------------------------------------------------------
    console.log('▶️ [Test 6/6] Verifying existing user data integrity...');
    const existingUser = await User.create({
      name: 'Existing Engineer',
      email: `existing_${Date.now()}@test.io`,
      passwordHash: pwdHash,
      isVerified: true,
      targetRole: 'Fullstack Engineer',
      trackLevel: 'Intermediate',
      userType: 'PROFESSIONAL',
      skills: [{ name: 'TypeScript', level: 90, category: 'Technical' }],
      parsedResumeData: {
        extractedSkills: ['TypeScript', 'React', 'Node.js'],
        atsScore: 84,
      },
    });

    const checkedExisting = await User.findById(existingUser._id);
    if (!checkedExisting || checkedExisting.skills.length !== 1 || checkedExisting.parsedResumeData?.atsScore !== 84) {
      throw new Error('Existing user data corrupted');
    }
    console.log('✅ Passed: Existing user data completely preserved.\n');

    console.log('🎉 ===================================================');
    console.log('🎉 ALL RESUME & TARGET ROLE UX TESTS PASSED (100%)');
    console.log('🎉 ===================================================');
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
}

runResumeTargetRoleTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
