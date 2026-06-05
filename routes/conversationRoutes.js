const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// ====================== ROTA DE DEBUG (coloque aqui) ======================
router.get('/:id/debug', protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    res.json({
      found: !!conv,
      id: req.params.id,
      conversation: conv
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== ROTAS PRINCIPAIS (mais específicas primeiro) ====================

// Buscar mensagens
router.get('/:id/messages', protect, getMessages);

// Rota de teste (opcional)
router.get('/:id/test-messages', (req, res) => {
  res.json({ message: 'Rota de teste funcionando!', conversationId: req.params.id });
});

// Buscar uma conversa específica
router.get('/:id', protect, getConversationById);

// Buscar todas as conversas
router.get('/', protect, getConversations);

module.exports = router;