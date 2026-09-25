import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';

async function verifyLogs() {
  await connectDB();
  const count = await CodeExecutionLog.countDocuments();
  const latestLogs = await CodeExecutionLog.find().sort({ createdAt: -1 }).limit(3);

  console.log(`✅ MongoDB Connection Verified`);
  console.log(`📊 Total CodeExecutionLog Documents: ${count}`);
  console.log(`🔍 Sample Document:`, JSON.stringify(latestLogs[0], null, 2));

  await mongoose.disconnect();
}

verifyLogs().catch(console.error);
