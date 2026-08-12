const bcrypt = require('bcryptjs');

console.time('Bcrypt Hash Sync');
const salt = bcrypt.genSaltSync(10);
const hashed = bcrypt.hashSync('mysecurepassword123', salt);
console.timeEnd('Bcrypt Hash Sync');
console.log('Hashed:', hashed);
