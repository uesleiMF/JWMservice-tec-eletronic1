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
router.get('/:id/messages', protect, getMessages);   // ← Essa é a rota que estava faltando

module.exports = router;