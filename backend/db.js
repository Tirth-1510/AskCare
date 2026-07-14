const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

// Initialize empty DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2), 'utf8');
}

function readData() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

const db = {
  getUsers: () => {
    return readData().users || [];
  },

  findUserByEmail: (email) => {
    if (!email) return null;
    const users = db.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser: (user) => {
    const data = readData();
    const newUser = {
      id: Date.now().toString(),
      name: user.name || '',
      email: user.email.toLowerCase(),
      password: user.password || null, // Can be null if passwordless register/login
      isVerified: user.isVerified || false,
      otp: user.otp || null,
      otpExpires: user.otpExpires || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },

  updateUser: (email, updates) => {
    const data = readData();
    const index = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) return null;

    data.users[index] = {
      ...data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(data);
    return data.users[index];
  }
};

module.exports = db;
