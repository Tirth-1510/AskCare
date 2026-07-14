const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB Atlas to check user status...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected.');
    const user = await User.findOne({ email: 'tirthmpatel151@gmail.com' });
    if (user) {
      console.log('\n=============================================');
      console.log('👤 USER FOUND IN MONGODB ATLAS:');
      console.log('👉 Email:', user.email);
      console.log('👉 Name:', user.name);
      console.log('👉 Verification Status (isVerified):', user.isVerified);
      console.log('👉 OTP Code in DB:', user.otp);
      console.log('👉 OTP Expiry:', user.otpExpires);
      console.log('=============================================\n');
    } else {
      console.log('\n❌ USER NOT FOUND IN MONGODB ATLAS database.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
