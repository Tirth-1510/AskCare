const { sendOTPEmail } = require('./mailer');

console.log('Sending test OTP email to tirthmpatel151@gmail.com...');
sendOTPEmail('tirthmpatel151@gmail.com', '999999', 'Test Connection')
  .then(res => {
    console.log('\n=========================');
    console.log('Test Script Result:', res);
    console.log('=========================');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n=========================');
    console.error('Test Script Error:', err);
    console.log('=========================');
    process.exit(1);
  });
