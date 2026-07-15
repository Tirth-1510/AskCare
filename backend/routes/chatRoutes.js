const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all chat routes with JWT authentication middleware
router.use(authMiddleware);

// Route mappings
router.post('/', chatController.createOrUpdateChat);
router.get('/history', chatController.getChatHistory);
router.get('/:id', chatController.getChatById);
router.delete('/:id', chatController.deleteChat);
router.patch('/:id', chatController.updateChatTitle);

module.exports = router;
