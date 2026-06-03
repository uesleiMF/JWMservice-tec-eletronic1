const express = require('express');
const router = express.Router();

const { 
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
  sendMessage
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, getOrCreateConversation);
router.get('/', protect, getUserConversations);
router.get('/:conversationId', protect, getConversationById);
router.post('/:conversationId/messages', protect, sendMessage);

module.exports = router;