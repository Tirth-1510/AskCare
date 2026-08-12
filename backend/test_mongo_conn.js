const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const uri = process.env.MONGODB_URI || "mongodb+srv://care_bot:Mgy9blff8KKRWGF0@cluster0.gvir6q4.mongodb.net/";
console.log('Connecting to:', uri);

mongoose.connect(uri)
  .then(async () => {
    console.log('✅ Connected successfully!');
    const User = require('./models/User');

    const testEmail = `test_speed_${Date.now()}@gmail.com`;

    console.time('1. Check if user exists (findOne)');
    const existingUser = await User.findOne({ email: testEmail });
    console.timeEnd('1. Check if user exists (findOne)');

    console.time('2. Hash password (bcrypt)');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('testpassword', salt);
    console.timeEnd('2. Hash password (bcrypt)');

    console.time('3. Save new user (save)');
    const newUser = new User({
      name: 'Test Speed',
      email: testEmail,
      password: hashedPassword,
      isVerified: false,
      otp: '123456',
      otpExpires: new Date()
    });
    await newUser.save();
    console.timeEnd('3. Save new user (save)');

    // Cleanup
    await User.deleteOne({ email: testEmail });

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
