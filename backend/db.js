/**
 * db.js — Local JSON File Database (Fallback Mode)
 *
 * This module provides a simple file-based database using db.json.
 * It is used as a fallback when MongoDB Atlas is not configured
 * (i.e., MONGODB_URI is empty or still a placeholder in .env).
 *
 * Data shape of db.json:
 * {
 *   "users":     [...],   // User account records
 *   "chats":     [...],   // Chat session records per user
 *   "documents": [...],   // Uploaded PDF document metadata
 *   "chunks":    [...]    // Vectorized text chunks per document (for RAG)
 * }
 *
 * All reads deserialize the file from disk; all writes serialize back.
 * This makes it simple but NOT suitable for concurrent/production use.
 * Switch to MongoDB Atlas for production deployments.
 */

const fs = require('fs');
const path = require('path');

// Absolute path to the JSON database file
const DB_PATH = path.join(__dirname, 'db.json');

// Initialize empty DB file if it doesn't exist (first-run setup)
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], chats: [] }, null, 2), 'utf8');
}

/**
 * readData — Reads and parses the entire db.json file.
 * @returns {Object} Parsed data object { users, chats, documents, chunks }
 */
function readData() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [] }; // Return a safe empty state on failure
  }
}

/**
 * writeData — Serializes and writes the data object back to db.json.
 * @param {Object} data — The full db state to persist
 */
function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// ════════════════════════════════════════════════════════════════════════
// DATABASE HELPERS OBJECT
// ════════════════════════════════════════════════════════════════════════
const db = {

  // ──────────────────────────────────────────
  // USER OPERATIONS
  // ──────────────────────────────────────────

  /** Returns the full list of all user records from db.json */
  getUsers: () => {
    return readData().users || [];
  },

  /**
   * Find a user by email address (case-insensitive comparison).
   * @param {string} email
   * @returns {Object|null} User object or null if not found
   */
  findUserByEmail: (email) => {
    if (!email) return null;
    const users = db.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  /**
   * Create a new user record and persist it.
   * Auto-generates a timestamp-based id.
   * @param {Object} user — { name, email, password, isVerified, otp, otpExpires }
   * @returns {Object} The newly created user object
   */
  createUser: (user) => {
    const data = readData();
    const newUser = {
      id: Date.now().toString(),         // Simple unique id based on epoch ms
      name: user.name || '',
      email: user.email.toLowerCase(),  // Always store email in lowercase
      password: user.password || null,  // Can be null if passwordless register/login
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

  /**
   * Apply partial updates to a user identified by email.
   * Merges the updates object with the existing user fields.
   * @param {string} email
   * @param {Object} updates — Partial fields to update
   * @returns {Object|null} Updated user or null if not found
   */
  updateUser: (email, updates) => {
    const data = readData();
    const index = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) return null;

    data.users[index] = {
      ...data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()  // Always bump updatedAt on change
    };
    writeData(data);
    return data.users[index];
  },

  /**
   * Delete all unverified users whose OTP expiry timestamp is in the past.
   * Called periodically to prevent zombie registrations from accumulating.
   * @param {Date} now — Current date used as the expiry threshold
   * @returns {number} Count of deleted users
   */
  deleteExpiredUnverifiedUsers: (now) => {
    const data = readData();
    const initialCount = data.users.length;
    data.users = data.users.filter(u => {
      if (u.isVerified) return true;       // Keep all verified users
      if (!u.otpExpires) return false;     // Remove if no expiry set (corrupt record)
      const expiry = new Date(u.otpExpires);
      return expiry.getTime() > now.getTime(); // Keep if OTP hasn't expired yet
    });
    const deletedCount = initialCount - data.users.length;
    if (deletedCount > 0) {
      writeData(data); // Only write if something actually changed
    }
    return deletedCount;
  },

  // ──────────────────────────────────────────
  // CHAT OPERATIONS
  // ──────────────────────────────────────────

  /** Returns all chat session records */
  getChats: () => {
    return readData().chats || [];
  },

  /**
   * Get all chat sessions belonging to a specific user.
   * @param {string} userId
   * @returns {Array} List of chat objects
   */
  getChatsByUser: (userId) => {
    const chats = db.getChats();
    const uIdStr = userId ? userId.toString() : '';
    return chats.filter(c => c.userId && c.userId.toString() === uIdStr);
  },

  /**
   * Find a single chat by its id or _id field.
   * Supports both formats since MongoDB and local db use different id naming.
   * @param {string} id
   * @returns {Object|null}
   */
  getChatById: (id) => {
    const chats = db.getChats();
    return chats.find(c => c.id === id || (c._id && c._id.toString() === id));
  },

  /**
   * Create a new chat session for a user.
   * @param {Object} chatData — { userId, title, messages }
   * @returns {Object} Newly created chat object
   */
  createChat: (chatData) => {
    const data = readData();
    if (!data.chats) data.chats = [];

    const newChat = {
      id: Date.now().toString(),
      _id: Date.now().toString(),           // Mirror _id for Mongoose compatibility
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

  /**
   * Update fields of an existing chat (e.g., add messages or rename title).
   * @param {string} id — Chat id
   * @param {Object} updates — Partial fields to update
   * @returns {Object|null}
   */
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

  /**
   * Delete a chat session by id.
   * @param {string} id
   * @returns {boolean} true if deleted, false if not found
   */
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

  // ──────────────────────────────────────────
  // DOCUMENT OPERATIONS
  // ──────────────────────────────────────────

  /** Returns all uploaded document metadata records */
  getDocuments: () => {
    return readData().documents || [];
  },

  /**
   * Get all documents uploaded by a specific user.
   * @param {string} userId
   * @returns {Array}
   */
  getDocumentsByUser: (userId) => {
    const documents = db.getDocuments();
    const uIdStr = userId ? userId.toString() : '';
    return documents.filter(d => d.userId && d.userId.toString() === uIdStr);
  },

  /**
   * Find a document record by id.
   * @param {string} id
   * @returns {Object|null}
   */
  getDocumentById: (id) => {
    const documents = db.getDocuments();
    return documents.find(d => d.id === id || (d._id && d._id.toString() === id));
  },

  /**
   * Create a new document metadata record (after PDF parsing and chunking).
   * @param {Object} docData — { userId, filename, fileSize, chunkCount }
   * @returns {Object} Newly created document record
   */
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

  /**
   * Delete a document and all its associated vector chunks.
   * Chunks are deleted alongside the document to keep storage clean.
   * @param {string} id — Document id
   * @returns {boolean} true if deleted, false if not found
   */
  deleteDocument: (id) => {
    const data = readData();
    if (!data.documents) data.documents = [];
    if (!data.chunks) data.chunks = [];

    const initialLength = data.documents.length;
    data.documents = data.documents.filter(d => d.id !== id && (!d._id || d._id.toString() !== id));
    
    // Also delete associated chunks — cascade delete
    data.chunks = data.chunks.filter(c => c.documentId !== id && (!c.documentId || c.documentId.toString() !== id));

    if (data.documents.length !== initialLength) {
      writeData(data);
      return true;
    }
    return false;
  },

  // ──────────────────────────────────────────
  // VECTOR CHUNK OPERATIONS (for RAG)
  // ──────────────────────────────────────────

  /** Returns all vector chunk records (used for similarity search) */
  getChunks: () => {
    return readData().chunks || [];
  },

  /**
   * Get all vector chunks owned by a specific user (for RAG context retrieval).
   * @param {string} userId
   * @returns {Array}
   */
  getChunksByUser: (userId) => {
    const chunks = db.getChunks();
    const uIdStr = userId ? userId.toString() : '';
    return chunks.filter(c => c.userId && c.userId.toString() === uIdStr);
  },

  /**
   * Store a new vector chunk extracted from a PDF document.
   * Each chunk contains the original text + its 384-dim embedding vector.
   * @param {Object} chunkData — { documentId, userId, text, embedding, pageNumber }
   * @returns {Object} Newly created chunk record
   */
  createChunk: (chunkData) => {
    const data = readData();
    if (!data.chunks) data.chunks = [];

    const newChunk = {
      id: (Date.now() + Math.random()).toString(), // Add random to avoid timestamp collisions during batch inserts
      _id: (Date.now() + Math.random()).toString(),
      documentId: chunkData.documentId ? chunkData.documentId.toString() : null,
      userId: chunkData.userId ? chunkData.userId.toString() : null,
      text: chunkData.text || '',
      embedding: chunkData.embedding || [],  // 384-dimensional float array
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
