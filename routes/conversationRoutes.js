const express = require('express');
const router = express.Router();

const {
  getConversations,
  getConversationById,
  getMessages,
  createConversation
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// ====================== ROTAS (ORDEM IMPORTANTE) ======================

// 1. Mais específica primeiro
router.get('/:id/messages', protect, getMessages);

// 2. Criar conversa
router.post('/', protect, createConversation);

// 3. Buscar conversa específica
router.get('/:id', protect, getConversationById);

// 4. Listar conversas
router.get('/', protect, getConversations);

module.exports = router;