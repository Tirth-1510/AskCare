const path = require('path');
const fs = require('fs');

// Set cwd to backend directory
process.chdir(path.join(__dirname, '..'));

require('dotenv').config();

const db = require('../db');
const User = require('../models/User');
const mongoose = require('mongoose');

async function testLocalJsonCleanup() {
  console.log('\n--- 📂 TESTING LOCAL JSON DATABASE CLEANUP ---');
  
  // 1. Create dummy users
  const now = new Date();
  const pastExpiry = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago
  const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  const user1 = db.createUser({
    name: 'Expired Unverified',
    email: 'expired_unverified@test.com',
    password: 'password123',
    isVerified: false,
    otp: '111111',
    otpExpires: pastExpiry
  });

  const user2 = db.createUser({
    name: 'Valid Unverified',
    email: 'valid_unverified@test.com',
    password: 'password123',
    isVerified: false,
    otp: '222222',
    otpExpires: futureExpiry
  });

  const user3 = db.createUser({
    name: 'Expired Verified',
    email: 'expired_verified@test.com',
    password: 'password123',
    isVerified: true,
    otp: null,
    otpExpires: pastExpiry
  });

  console.log('Created 3 dummy test users in db.json.');

  // 2. Run cleanup
  console.log('Running db.deleteExpiredUnverifiedUsers...');
  const deletedCount = db.deleteExpiredUnverifiedUsers(now);
  console.log(`Deleted ${deletedCount} user(s).`);

  // 3. Verify
  const users = db.getUsers();
  const foundUser1 = users.find(u => u.email === 'expired_unverified@test.com');
  const foundUser2 = users.find(u => u.email === 'valid_unverified@test.com');
  const foundUser3 = users.find(u => u.email === 'expired_verified@test.com');

  let success = true;
  if (foundUser1) {
    console.error('❌ FAIL: Expired unverified user was NOT deleted.');
    success = false;
  } else {
    console.log('✅ PASS: Expired unverified user was successfully deleted.');
  }

  if (!foundUser2) {
    console.error('❌ FAIL: Valid unverified user was deleted.');
    success = false;
  } else {
    console.log('✅ PASS: Valid unverified user was kept.');
  }

  if (!foundUser3) {
    console.error('❌ FAIL: Verified user (even with expired OTP timestamp) was deleted.');
    success = false;
  } else {
    console.log('✅ PASS: Verified user was kept.');
  }

  // Cleanup: Delete remaining test users
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'db.json'), 'utf8'));
  data.users = data.users.filter(u => 
    u.email !== 'valid_unverified@test.com' && 
    u.email !== 'expired_verified@test.com'
  );
  fs.writeFileSync(path.join(process.cwd(), 'db.json'), JSON.stringify(data, null, 2), 'utf8');
  console.log('Cleaned up remaining dummy users from db.json.');

  return success;
}

async function testMongoCleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('cluster0.xxxxx.mongodb.net')) {
    console.log('\n--- 🍃 MONGODB CLEANUP SKIPPED (No valid URI) ---');
    return true;
  }

  console.log('\n--- 🍃 TESTING MONGODB ATLAS DATABASE CLEANUP ---');
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    // Clear any leftover test users first
    await User.deleteMany({
      email: { $in: ['expired_unverified@test.com', 'valid_unverified@test.com', 'expired_verified@test.com'] }
    });

    const now = new Date();
    const pastExpiry = new Date(now.getTime() - 10 * 60 * 1000);
    const futureExpiry = new Date(now.getTime() + 10 * 60 * 1000);

    // Create dummy users
    await User.create([
      {
        name: 'Expired Unverified',
        email: 'expired_unverified@test.com',
        password: 'password123',
        isVerified: false,
        otp: '111111',
        otpExpires: pastExpiry
      },
      {
        name: 'Valid Unverified',
        email: 'valid_unverified@test.com',
        password: 'password123',
        isVerified: false,
        otp: '222222',
        otpExpires: futureExpiry
      },
      {
        name: 'Expired Verified',
        email: 'expired_verified@test.com',
        password: 'password123',
        isVerified: true,
        otp: null,
        otpExpires: pastExpiry
      }
    ]);
    console.log('Created 3 dummy test users in MongoDB.');

    // Run cleanup
    const result = await User.deleteMany({
      isVerified: false,
      otpExpires: { $lt: now }
    });
    console.log(`Deleted ${result.deletedCount} user(s).`);

    // Verify
    const foundUser1 = await User.findOne({ email: 'expired_unverified@test.com' });
    const foundUser2 = await User.findOne({ email: 'valid_unverified@test.com' });
    const foundUser3 = await User.findOne({ email: 'expired_verified@test.com' });

    let success = true;
    if (foundUser1) {
      console.error('❌ FAIL: Expired unverified user was NOT deleted in MongoDB.');
      success = false;
    } else {
      console.log('✅ PASS: Expired unverified user was successfully deleted in MongoDB.');
    }

    if (!foundUser2) {
      console.error('❌ FAIL: Valid unverified user was deleted in MongoDB.');
      success = false;
    } else {
      console.log('✅ PASS: Valid unverified user was kept in MongoDB.');
    }

    if (!foundUser3) {
      console.error('❌ FAIL: Verified user was deleted in MongoDB.');
      success = false;
    } else {
      console.log('✅ PASS: Verified user was kept in MongoDB.');
    }

    // Cleanup: Delete remaining test users
    await User.deleteMany({
      email: { $in: ['valid_unverified@test.com', 'expired_verified@test.com'] }
    });
    console.log('Cleaned up remaining dummy users from MongoDB.');

    await mongoose.disconnect();
    return success;
  } catch (error) {
    console.error('❌ MongoDB Test Error:', error);
    try { await mongoose.disconnect(); } catch (e) {}
    return false;
  }
}

async function runAllTests() {
  try {
    const localPassed = await testLocalJsonCleanup();
    const mongoPassed = await testMongoCleanup();

    if (localPassed && mongoPassed) {
      console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟\n');
      process.exit(0);
    } else {
      console.error('\n❌ SOME TESTS FAILED. ❌\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();
