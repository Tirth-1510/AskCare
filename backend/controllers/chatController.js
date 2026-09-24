/**
 * chatController.js — Chat Session Business Logic
 *
 * Handles all chat-related operations for the AskCare medical AI assistant.
 *
 * Key responsibilities:
 *   1. createOrUpdateChat — Accept a user message, retrieve RAG context from uploaded
 *      documents, call the AI service, and persist the full exchange.
 *   2. getChatHistory     — Return a summarized list of the user's past sessions.
 *   3. getChatById        — Return the full message history of one session.
 *   4. deleteChat         — Permanently remove a session and its messages.
 *   5. updateChatTitle    — Rename a session's title.
 *
 * Dual-database support:
 *   Uses the same useMongo flag as server.js to route all queries to either
 *   MongoDB Atlas (Mongoose) or the local db.json file (db.js helpers).
 */

const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
const db = require('../db');
const aiService = require('../services/ai.service');
const documentController = require('./documentController');
const { AVAILABLE_MODELS, DEFAULT_MODEL_ID, findModelById } = require('../config/models.config');
require('dotenv').config();

// ────────────────────────────────────────────────────────────────────────
// Database Mode Detection
// ────────────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || '';
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder;  // true = Atlas, false = local JSON file

/**
 * generateTitle — Produces a short display title from the user's first message.
 * Truncates to 27 characters and appends "..." if needed.
 * @param {string} message — The first user message
 * @returns {string} A ≤30 character title string
 */
const generateTitle = (message) => {
  const cleanMessage = message.trim();
  if (cleanMessage.length <= 30) {
    return cleanMessage;
  }
  return cleanMessage.substring(0, 27) + '...';
};

// ════════════════════════════════════════════════════════════════════════
// 1. Create or Continue Chat — POST /api/chat
// ════════════════════════════════════════════════════════════════════════
/**
 * createOrUpdateChat — Core message handler with production-grade dual-layer memory.
 *
 * Full pipeline:
 *   a. Load persistent User Clinical Memory (patient profile, allergies, chronic conditions).
 *   b. Auto-extract newly mentioned facts (e.g. allergies, conditions, name) from user prompt.
 *   c. If chatId provided, load existing session and fetch last 20 messages for rich conversational context.
 *   d. Retrieve RAG document context if available.
 *   e. Generate clinical response with multi-turn thread memory + user memory.
 *   f. Persist messages and return updated chat + clinical profile.
 */
exports.createOrUpdateChat = async (req, res) => {
  const { message, chatId, model } = req.body;
  const userId = req.user.id; // Injected by authMiddleware after JWT verification

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  try {
    const userPrompt = message.trim();
    const userMessage = { sender: 'user', content: userPrompt, timestamp: new Date() };

    // ── 1. Load User Clinical Memory (User Layer) ─────────────────────────
    let userProfile = { patientName: '', allergies: [], chronicConditions: [], medications: [], memories: [] };
    let userDoc = null;

    if (useMongo) {
      userDoc = await User.findById(userId);
      if (userDoc) {
        userProfile = userDoc.clinicalProfile ? userDoc.clinicalProfile.toObject() : userProfile;
        if (!userProfile.patientName && userDoc.name) {
          userProfile.patientName = userDoc.name;
        }
      }
    } else {
      userDoc = db.findUserById(userId);
      if (userDoc) {
        userProfile = userDoc.clinicalProfile || userProfile;
        if (!userProfile.patientName && userDoc.name) {
          userProfile.patientName = userDoc.name;
        }
      }
    }

    // Auto-extract any permanent patient facts mentioned in this message
    const newFacts = aiService.extractUserClinicalFacts(userPrompt);
    if (newFacts && userDoc) {
      let changed = false;
      if (newFacts.patientName && userProfile.patientName !== newFacts.patientName) {
        userProfile.patientName = newFacts.patientName;
        changed = true;
      }
      if (newFacts.allergy && !userProfile.allergies.includes(newFacts.allergy)) {
        userProfile.allergies.push(newFacts.allergy);
        changed = true;
      }
      if (newFacts.condition && !userProfile.chronicConditions.includes(newFacts.condition)) {
        userProfile.chronicConditions.push(newFacts.condition);
        changed = true;
      }
      if (newFacts.medication && !userProfile.medications.includes(newFacts.medication)) {
        userProfile.medications.push(newFacts.medication);
        changed = true;
      }

      if (changed) {
        if (useMongo) {
          userDoc.clinicalProfile = userProfile;
          await userDoc.save();
        } else {
          db.updateUserById(userId, { clinicalProfile: userProfile });
        }
      }
    }

    let chatHistory = [];
    let chatObj = null;

    // ── 2. Load Existing Chat & Thread History (Chat Layer) ──────────────
    if (chatId) {
      if (useMongo) {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
        }
        // findOne with both _id and userId strictly enforces user isolation
        chatObj = await Chat.findOne({ _id: chatId, userId });
      } else {
        chatObj = db.getChatById(chatId);
        if (chatObj && chatObj.userId.toString() !== userId.toString()) {
          chatObj = null;
        }
      }

      if (!chatObj) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      // Deep multi-turn context: pass last 20 messages for full conversational recall
      chatHistory = chatObj.messages.slice(-20);
    }

    // Determine target model (explicit request > existing chat model > system default)
    const targetModel = model || (chatObj && chatObj.model) || DEFAULT_MODEL_ID;

    // Append current prompt for the LLM
    chatHistory.push(userMessage);

    // ── 3. RAG Context Retrieval ──────────────────────────────────────────
    const context = await documentController.retrieveRelevantContext(userId, userPrompt);

    // ── 4. AI Response Generation ─────────────────────────────────────────
    // Multi-turn consultation history + user clinical memory + document context + dynamic model selection
    const aiResult = await aiService.generateResponse(chatHistory, context, userProfile, targetModel);
    const aiContent = typeof aiResult === 'object' ? aiResult.content : aiResult;
    const modelUsed = (typeof aiResult === 'object' && aiResult.modelUsed) ? aiResult.modelUsed : targetModel;

    const aiMessage = {
      sender: 'ai',
      content: aiContent,
      model: modelUsed,
      timestamp: new Date()
    };

    // ── 5. Persist Messages & Return ──────────────────────────────────────
    if (chatId) {
      chatObj.messages.push(userMessage);
      chatObj.messages.push(aiMessage);
      chatObj.model = targetModel;

      if (useMongo) {
        await chatObj.save();
        return res.json({ success: true, chat: chatObj, modelUsed, clinicalProfile: userProfile });
      } else {
        const updatedChat = db.updateChat(chatId, { messages: chatObj.messages, model: chatObj.model });
        return res.json({ success: true, chat: updatedChat, modelUsed, clinicalProfile: userProfile });
      }
    }

    // New Chat Session
    const title = generateTitle(userPrompt);
    const messages = [userMessage, aiMessage];

    if (useMongo) {
      const newChat = new Chat({
        userId,
        title,
        model: targetModel,
        messages
      });
      await newChat.save();
      return res.status(201).json({ success: true, chat: newChat, modelUsed, clinicalProfile: userProfile });
    } else {
      const newChat = db.createChat({
        userId,
        title,
        model: targetModel,
        messages
      });
      return res.status(201).json({ success: true, chat: newChat, modelUsed, clinicalProfile: userProfile });
    }
  } catch (error) {
    console.error('Error in createOrUpdateChat:', error);
    return res.status(500).json({ success: false, message: 'Server error while processing chat message.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 2. Get Chat History — GET /api/chat/history
// ════════════════════════════════════════════════════════════════════════
/**
 * getChatHistory — Returns a lightweight list of the user's past sessions.
 * Includes: id, title, model, timestamps, message count, and the last message snippet.
 * Sorted by most recently updated (newest first).
 */
exports.getChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    if (useMongo) {
      const chats = await Chat.find({ userId })
        .sort({ updatedAt: -1 })                               // Newest first
        .select('_id title model createdAt updatedAt messages'); // Only fetch fields we need

      // Transform response to include message count and last message snippet
      const history = chats.map(c => ({
        id: c._id,
        title: c.title,
        model: c.model || 'open-mistral-7b',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1] : null
      }));

      return res.json({ success: true, history });
    } else {
      const chats = db.getChatsByUser(userId);
      
      // Sort by updatedAt descending (manual sort for local db)
      chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      const history = chats.map(c => ({
        id: c.id,
        title: c.title,
        model: c.model || 'open-mistral-7b',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1] : null
      }));

      return res.json({ success: true, history });
    }

  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching chat history.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 3. Get Single Chat — GET /api/chat/:id
// ════════════════════════════════════════════════════════════════════════
/**
 * getChatById — Returns the full message history of a specific session.
 * Enforces ownership: a user can only access their own sessions.
 */
exports.getChatById = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
      }

      // findOne with userId ensures ownership enforcement at the DB level
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      return res.json({ success: true, chat });
    } else {
      const chat = db.getChatById(chatId);
      // Manual ownership check for the local db fallback
      if (!chat || chat.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      return res.json({ success: true, chat });
    }
  } catch (error) {
    console.error('Error in getChatById:', error);
    return res.status(500).json({ success: false, message: 'Server error while retrieving chat details.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 4. Delete Chat — DELETE /api/chat/:id
// ════════════════════════════════════════════════════════════════════════
/**
 * deleteChat — Permanently removes a chat session.
 * Ownership is verified before deletion to prevent cross-user data tampering.
 */
exports.deleteChat = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
      }

      // findOneAndDelete with userId predicate — atomic ownership check + delete
      const deletedChat = await Chat.findOneAndDelete({ _id: chatId, userId });
      if (!deletedChat) {
        return res.status(404).json({ success: false, message: 'Chat session not found or access denied.' });
      }

      return res.json({ success: true, message: 'Chat session deleted successfully.' });
    } else {
      const chat = db.getChatById(chatId);
      if (!chat || chat.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Chat session not found or access denied.' });
      }

      const success = db.deleteChat(chatId);
      if (!success) {
        return res.status(500).json({ success: false, message: 'Failed to delete chat from fallback storage.' });
      }

      return res.json({ success: true, message: 'Chat session deleted successfully.' });
    }
  } catch (error) {
    console.error('Error in deleteChat:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting chat session.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 5. Update Chat Title — PATCH /api/chat/:id
// ════════════════════════════════════════════════════════════════════════
/**
 * updateChatTitle — Renames a chat session's display title.
 * Only the owner can rename their own sessions.
 */
exports.updateChatTitle = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required.' });
  }

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
      }

      // findOneAndUpdate with { new: true } returns the updated document immediately
      const chat = await Chat.findOneAndUpdate(
        { _id: chatId, userId },          // Predicate enforces ownership
        { title: title.trim() },
        { new: true }                     // Return the updated document
      );
      
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      return res.json({ success: true, chat });
    } else {
      const chat = db.getChatById(chatId);
      if (!chat || chat.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      const updatedChat = db.updateChat(chatId, { title: title.trim() });
      return res.json({ success: true, chat: updatedChat });
    }
  } catch (error) {
    console.error('Error in updateChatTitle:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating chat title.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 6. User Clinical Memory Management (User Layer)
// ════════════════════════════════════════════════════════════════════════

/**
 * getUserMemory — Returns the authenticated user's persistent clinical memory.
 */
exports.getUserMemory = async (req, res) => {
  const userId = req.user.id;
  try {
    let userProfile = { patientName: '', allergies: [], chronicConditions: [], medications: [], memories: [] };
    if (useMongo) {
      const user = await User.findById(userId).select('name clinicalProfile');
      if (user) {
        userProfile = user.clinicalProfile ? user.clinicalProfile.toObject() : userProfile;
        if (!userProfile.patientName && user.name) userProfile.patientName = user.name;
      }
    } else {
      const user = db.findUserById(userId);
      if (user) {
        userProfile = user.clinicalProfile || userProfile;
        if (!userProfile.patientName && user.name) userProfile.patientName = user.name;
      }
    }
    return res.json({ success: true, memory: userProfile });
  } catch (error) {
    console.error('Error fetching user memory:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve clinical memory.' });
  }
};

/**
 * updateUserMemory — Updates or appends clinical memory items for the user.
 */
exports.updateUserMemory = async (req, res) => {
  const userId = req.user.id;
  const { patientName, allergies, chronicConditions, medications, memories } = req.body;
  try {
    const updates = {};
    if (patientName !== undefined) updates.patientName = patientName;
    if (allergies !== undefined) updates.allergies = allergies;
    if (chronicConditions !== undefined) updates.chronicConditions = chronicConditions;
    if (medications !== undefined) updates.medications = medications;
    if (memories !== undefined) updates.memories = memories;

    let updatedProfile = updates;
    if (useMongo) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.clinicalProfile = { ...(user.clinicalProfile ? user.clinicalProfile.toObject() : {}), ...updates };
      await user.save();
      updatedProfile = user.clinicalProfile;
    } else {
      const user = db.findUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const current = user.clinicalProfile || {};
      const newProfile = { ...current, ...updates };
      db.updateUserById(userId, { clinicalProfile: newProfile });
      updatedProfile = newProfile;
    }
    return res.json({ success: true, memory: updatedProfile });
  } catch (error) {
    console.error('Error updating user memory:', error);
    return res.status(500).json({ success: false, message: 'Failed to update clinical memory.' });
  }
};

/**
 * clearUserMemory — Clears the user's clinical memory.
 */
exports.clearUserMemory = async (req, res) => {
  const userId = req.user.id;
  try {
    const emptyProfile = { patientName: '', allergies: [], chronicConditions: [], medications: [], memories: [] };
    if (useMongo) {
      await User.findByIdAndUpdate(userId, { clinicalProfile: emptyProfile });
    } else {
      db.updateUserById(userId, { clinicalProfile: emptyProfile });
    }
    return res.json({ success: true, message: 'Clinical memory cleared successfully.', memory: emptyProfile });
  } catch (error) {
    console.error('Error clearing user memory:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear clinical memory.' });
  }
};

// ════════════════════════════════════════════════════════════════════════
// 7. Clinical AI Models Registry — GET /api/chat/models
// ════════════════════════════════════════════════════════════════════════
/**
 * getAvailableModels — Returns the list of clinical AI models available
 * for user selection in the AskCare consultation interface.
 */
exports.getAvailableModels = async (req, res) => {
  try {
    return res.json({
      success: true,
      defaultModel: DEFAULT_MODEL_ID,
      models: AVAILABLE_MODELS
    });
  } catch (error) {
    console.error('Error in getAvailableModels:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve available models.' });
  }
};

