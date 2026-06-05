// routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// ==================== ROTAS MAIS ESPECÍFICAS PRIMEIRO ====================

// Buscar mensagens de uma conversa
router.get('/:id/messages', protect, getMessages);

// Rota de teste
router.get('/:id/test-messages', (req, res) => {
  res.json({ 
    message: 'Rota de teste funcionando!', 
    conversationId: req.params.id 
  });
});

// Buscar uma conversa específica
router.get('/:id', protect, getConversationById);

// Buscar todas as conversas
router.get('/', protect, getConversations);

module.exports = router;