/**
 * Chat.js — Mongoose Chat Session Model
 *
 * Represents a single conversation session between a user and the AskCare AI.
 * Each chat document stores the full message history as an embedded array.
 *
 * Schema structure:
 *   Chat {
 *     userId:   ObjectId → references User (ownership)
 *     title:    Auto-generated from the first user message (trimmed to 30 chars)
 *     messages: Array of Message sub-documents (see messageSchema below)
 *     createdAt / updatedAt: Auto-managed by Mongoose
 *   }
 *
 *   Message {
 *     sender:    'user' | 'ai' | 'assistant' — who sent this message
 *     content:   The full text of the message
 *     timestamp: When the message was sent (default: now)
 *   }
 *
 * Design notes:
 *   - Messages are embedded (not referenced) for fast single-query retrieval.
 *   - The chat controller limits history to the last 10 messages when building
 *     the LLM prompt context to stay within token limits.
 */

const mongoose = require('mongoose');

// Sub-schema for individual messages within a chat session
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai', 'assistant']  // Only these three values are valid senders
  },
  content: {
    type: String,
    required: true  // Every message must have text
  },
  timestamp: {
    type: Date,
    default: Date.now  // Records when each message was created
  }
});

// Main chat session schema — one document per conversation thread
const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',    // Logical foreign key to the User collection
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'  // Overwritten with a snippet of the first user message
  },
  messages: [messageSchema]  // Embedded message history (no separate collection)
}, {
  timestamps: true  // Auto-manage createdAt / updatedAt
});

module.exports = mongoose.model('Chat', chatSchema);
