/**
 * chatRoutes.js — Chat API Route Definitions
 *
 * Mounts all chat-related routes under /api/chat (see server.js).
 * ALL routes here are protected by authMiddleware — a valid JWT is required.
 *
 * Route Map:
 *   POST   /api/chat          → createOrUpdateChat  — Send a message; creates or continues a chat session
 *   GET    /api/chat/history  → getChatHistory      — List all chat sessions for the logged-in user
 *   GET    /api/chat/:id      → getChatById         — Retrieve the full message history of a specific chat
 *   DELETE /api/chat/:id      → deleteChat          — Permanently delete a chat session
 *   PATCH  /api/chat/:id      → updateChatTitle     — Rename a chat session's title
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all chat routes with JWT authentication middleware
// Any request without a valid Bearer token is rejected with 401 before reaching a handler
router.use(authMiddleware);

// Route mappings
router.post('/', chatController.createOrUpdateChat);          // Send a message (new or continue)
router.get('/history', chatController.getChatHistory);        // List all past chat sessions

// Clinical AI Models Registry
router.get('/models', chatController.getAvailableModels);     // List available clinical models

// User Clinical Memory Routes (Placed before /:id)
router.get('/memory', chatController.getUserMemory);          // Get user's persistent clinical profile
router.put('/memory', chatController.updateUserMemory);       // Update user's persistent clinical profile
router.delete('/memory', chatController.clearUserMemory);     // Clear user's persistent clinical profile

router.get('/:id', chatController.getChatById);               // Get full details of one chat
router.delete('/:id', chatController.deleteChat);             // Delete a specific chat
router.patch('/:id', chatController.updateChatTitle);         // Rename a chat's title

module.exports = router;
