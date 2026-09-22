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
const db = require('../db');
const aiService = require('../services/ai.service');
const documentController = require('./documentController');
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
 * createOrUpdateChat — Core message handler.
 *
 * Full pipeline:
 *   a. If chatId is provided, load the existing session and its history.
 *   b. Limit history to the last 10 messages for LLM context window efficiency.
 *   c. Retrieve relevant clinical context from the user's uploaded PDFs via RAG.
 *   d. Send the conversation + context to the AI service (SmolLM3 or mock).
 *   e. Append both the user message and the AI reply to the session.
 *   f. Persist the updated session and return it.
 *
 * If no chatId is provided → a new session is created with an auto-generated title.
 */
exports.createOrUpdateChat = async (req, res) => {
  const { message, chatId } = req.body;
  const userId = req.user.id; // Injected by authMiddleware after JWT verification

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  try {
    const userPrompt = message.trim();
    const userMessage = { sender: 'user', content: userPrompt, timestamp: new Date() };

    let chatHistory = [];
    let chatObj = null;

    // ── A. Load Existing Chat (if continuing a session) ──────────────────
    if (chatId) {
      if (useMongo) {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
        }
        // findOne with both _id and userId ensures users can only access their own chats
        chatObj = await Chat.findOne({ _id: chatId, userId });
      } else {
        chatObj = db.getChatById(chatId);
        // Ownership check for local db (Mongoose enforces this via the query predicate above)
        if (chatObj && chatObj.userId.toString() !== userId.toString()) {
          chatObj = null;
        }
      }

      if (!chatObj) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      // Limit history size to last 10 messages for performance and context limits
      chatHistory = chatObj.messages.slice(-10);
    }

    // Append current prompt for the LLM (must come after history truncation)
    chatHistory.push(userMessage);

    // ── B. RAG Context Retrieval ──────────────────────────────────────────
    // Embed the query and find the most semantically similar document chunks
    // from the user's uploaded PDFs. Returns a string to inject into the prompt.
    const context = await documentController.retrieveRelevantContext(userId, userPrompt);

    // ── C. AI Response Generation ─────────────────────────────────────────
    // Call SmolLM3-3B (via Together.xyz API) or fall back to local mock answers
    const aiResponse = await aiService.generateResponse(chatHistory, context);
    const aiMessage = { sender: 'ai', content: aiResponse, timestamp: new Date() };

    // ── D. Persist Messages ───────────────────────────────────────────────

    // D1. Continue Existing Chat — append both messages and save
    if (chatId) {
      if (useMongo) {
        chatObj.messages.push(userMessage);
        chatObj.messages.push(aiMessage);
        await chatObj.save(); // Mongoose auto-updates updatedAt
        return res.json({ success: true, chat: chatObj });
      } else {
        chatObj.messages.push(userMessage);
        chatObj.messages.push(aiMessage);
        const updatedChat = db.updateChat(chatId, { messages: chatObj.messages });
        return res.json({ success: true, chat: updatedChat });
      }
    }

    // D2. Create New Chat — title comes from the first user message
    const title = generateTitle(userPrompt);
    const messages = [userMessage, aiMessage];

    if (useMongo) {
      const newChat = new Chat({
        userId,
        title,
        messages
      });
      await newChat.save();
      return res.status(201).json({ success: true, chat: newChat });
    } else {
      const newChat = db.createChat({
        userId,
        title,
        messages
      });
      return res.status(201).json({ success: true, chat: newChat });
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
 * Includes: id, title, timestamps, message count, and the last message snippet.
 * Sorted by most recently updated (newest first).
 */
exports.getChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    if (useMongo) {
      const chats = await Chat.find({ userId })
        .sort({ updatedAt: -1 })                               // Newest first
        .select('_id title createdAt updatedAt messages');     // Only fetch fields we need

      // Transform response to include message count and last message snippet
      const history = chats.map(c => ({
        id: c._id,
        title: c.title,
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
