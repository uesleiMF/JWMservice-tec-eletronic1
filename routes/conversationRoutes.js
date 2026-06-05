// routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// Rotas protegidas
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);

// ← REMOVA O PROTECT TEMPORARIAMENTE AQUI:
router.get('/:id/messages', getMessages);   // sem protect

module.exports = router;