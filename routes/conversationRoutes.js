const express = require('express');
const router = express.Router();

const {
  getConversations,
  getConversationById,
  getMessages,
  createConversation   // ← Adicionado
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// ====================== ROTA DE DEBUG (remova depois) ======================
router.get('/:id/debug', async (req, res) => {
  try {
    const Conversation = require('../models/Conversation');
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

// ==================== ROTAS PRINCIPAIS ====================

// Buscar mensagens de uma conversa
router.get('/:id/messages', protect, getMessages);

// Criar nova conversa
router.post('/', protect, createConversation);

// Buscar uma conversa específica
router.get('/:id', protect, getConversationById);

// Buscar todas as conversas do usuário
router.get('/', protect, getConversations);

// Rota de teste (opcional - pode remover depois)
router.get('/:id/test-messages', (req, res) => {
  res.json({ 
    message: 'Rota de teste funcionando!', 
    conversationId: req.params.id 
  });
});

module.exports = router;