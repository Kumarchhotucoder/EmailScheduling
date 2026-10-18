import mongoose from 'mongoose';
import { beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/email_scheduler_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB(TEST_MONGODB_URI);
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await disconnectDB();
});
