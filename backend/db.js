const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

// Initialize empty DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], chats: [] }, null, 2), 'utf8');
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
  },

  getChats: () => {
    return readData().chats || [];
  },

  getChatsByUser: (userId) => {
    const chats = db.getChats();
    const uIdStr = userId ? userId.toString() : '';
    return chats.filter(c => c.userId && c.userId.toString() === uIdStr);
  },

  getChatById: (id) => {
    const chats = db.getChats();
    return chats.find(c => c.id === id || (c._id && c._id.toString() === id));
  },

  createChat: (chatData) => {
    const data = readData();
    if (!data.chats) data.chats = [];

    const newChat = {
      id: Date.now().toString(),
      _id: Date.now().toString(),
      userId: chatData.userId ? chatData.userId.toString() : null,
      title: chatData.title || 'New Chat',
      messages: chatData.messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.chats.push(newChat);
    writeData(data);
    return newChat;
  },

  updateChat: (id, updates) => {
    const data = readData();
    if (!data.chats) data.chats = [];

    const index = data.chats.findIndex(c => c.id === id || (c._id && c._id.toString() === id));
    if (index === -1) return null;

    data.chats[index] = {
      ...data.chats[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(data);
    return data.chats[index];
  },

  deleteChat: (id) => {
    const data = readData();
    if (!data.chats) data.chats = [];

    const initialLength = data.chats.length;
    data.chats = data.chats.filter(c => c.id !== id && (!c._id || c._id.toString() !== id));

    if (data.chats.length !== initialLength) {
      writeData(data);
      return true;
    }
    return false;
  },

  getDocuments: () => {
    return readData().documents || [];
  },

  getDocumentsByUser: (userId) => {
    const documents = db.getDocuments();
    const uIdStr = userId ? userId.toString() : '';
    return documents.filter(d => d.userId && d.userId.toString() === uIdStr);
  },

  getDocumentById: (id) => {
    const documents = db.getDocuments();
    return documents.find(d => d.id === id || (d._id && d._id.toString() === id));
  },

  createDocument: (docData) => {
    const data = readData();
    if (!data.documents) data.documents = [];

    const newDoc = {
      id: Date.now().toString(),
      _id: Date.now().toString(),
      userId: docData.userId ? docData.userId.toString() : null,
      filename: docData.filename || '',
      fileSize: docData.fileSize || 0,
      chunkCount: docData.chunkCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.documents.push(newDoc);
    writeData(data);
    return newDoc;
  },

  deleteDocument: (id) => {
    const data = readData();
    if (!data.documents) data.documents = [];
    if (!data.chunks) data.chunks = [];

    const initialLength = data.documents.length;
    data.documents = data.documents.filter(d => d.id !== id && (!d._id || d._id.toString() !== id));
    
    // Also delete associated chunks
    data.chunks = data.chunks.filter(c => c.documentId !== id && (!c.documentId || c.documentId.toString() !== id));

    if (data.documents.length !== initialLength) {
      writeData(data);
      return true;
    }
    return false;
  },

  getChunks: () => {
    return readData().chunks || [];
  },

  getChunksByUser: (userId) => {
    const chunks = db.getChunks();
    const uIdStr = userId ? userId.toString() : '';
    return chunks.filter(c => c.userId && c.userId.toString() === uIdStr);
  },

  createChunk: (chunkData) => {
    const data = readData();
    if (!data.chunks) data.chunks = [];

    const newChunk = {
      id: (Date.now() + Math.random()).toString(),
      _id: (Date.now() + Math.random()).toString(),
      documentId: chunkData.documentId ? chunkData.documentId.toString() : null,
      userId: chunkData.userId ? chunkData.userId.toString() : null,
      text: chunkData.text || '',
      embedding: chunkData.embedding || [],
      pageNumber: chunkData.pageNumber || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.chunks.push(newChunk);
    writeData(data);
    return newChunk;
  }
};

module.exports = db;
