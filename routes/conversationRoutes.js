const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// ====================== ROTA DE DEBUG (SEM PROTECT) ======================

router.get('/:id/debug', async (req, res) => {
  try {
    const Conversation = require('../models/Conversation'); // ← Importação aqui
    
    const conv = await Conversation.findById(req.params.id);
    
    res.json({
      found: !!conv,
      id: req.params.id,
      conversation: conv || null,
      message: conv ? "✅ Conversa encontrada" : "❌ Conversa NÃO encontrada"
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 
      error: e.message,
      message: "Erro ao buscar conversa"
    });
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