const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const db = require('../db');
const aiService = require('../services/ai.service');
require('dotenv').config();

// Determine database mode
const MONGODB_URI = process.env.MONGODB_URI || '';
const isMongoPlaceholder = !MONGODB_URI || MONGODB_URI.includes('cluster0.xxxxx.mongodb.net');
const useMongo = !isMongoPlaceholder;

// Helper to generate chat title from first message
const generateTitle = (message) => {
  const cleanMessage = message.trim();
  if (cleanMessage.length <= 30) {
    return cleanMessage;
  }
  return cleanMessage.substring(0, 27) + '...';
};

// 1. Create or Continue Chat (POST /api/chat)
exports.createOrUpdateChat = async (req, res) => {
  const { message, chatId } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  try {
    const userPrompt = message.trim();
    const userMessage = { sender: 'user', content: userPrompt, timestamp: new Date() };

    let chatHistory = [];
    let chatObj = null;

    // Load conversation context if continuing
    if (chatId) {
      if (useMongo) {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
        }
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

      // Limit history size to last 10 messages for performance and context limits
      chatHistory = chatObj.messages.slice(-10);
    }

    // Append current prompt for the LLM
    chatHistory.push(userMessage);

    // Call Gemma 3 AI service
    const aiResponse = await aiService.generateResponse(chatHistory);
    const aiMessage = { sender: 'ai', content: aiResponse, timestamp: new Date() };

    // A. Continue Existing Chat
    if (chatId) {
      if (useMongo) {
        chatObj.messages.push(userMessage);
        chatObj.messages.push(aiMessage);
        await chatObj.save();
        return res.json({ success: true, chat: chatObj });
      } else {
        chatObj.messages.push(userMessage);
        chatObj.messages.push(aiMessage);
        const updatedChat = db.updateChat(chatId, { messages: chatObj.messages });
        return res.json({ success: true, chat: updatedChat });
      }
    }

    // B. Create New Chat
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

// 2. Get Chat History (GET /api/chat/history)
exports.getChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    if (useMongo) {
      const chats = await Chat.find({ userId })
        .sort({ updatedAt: -1 })
        .select('_id title createdAt updatedAt messages');

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
      
      // Sort by updatedAt descending
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

// 3. Get Single Chat (GET /api/chat/:id)
exports.getChatById = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
      }

      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found.' });
      }

      return res.json({ success: true, chat });
    } else {
      const chat = db.getChatById(chatId);
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

// 4. Delete Chat (DELETE /api/chat/:id)
exports.deleteChat = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  try {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid Chat ID format.' });
      }

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

// 5. Update Chat Title (PATCH /api/chat/:id)
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

      const chat = await Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { title: title.trim() },
        { new: true }
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

