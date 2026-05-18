/**
 * One-time seed: create an admin user for testing.
 * Run: node scripts/seedAdmin.js (from backend folder, with MONGODB_URI set)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const ADMIN_EMAIL = 'admin@platform.com';
const ADMIN_PASSWORD = 'admin123';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_platform');
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin user already exists.');
    process.exit(0);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });
  console.log('Admin user created:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
