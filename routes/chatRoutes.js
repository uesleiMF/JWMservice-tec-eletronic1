const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// ====================
// INICIAR CONVERSA
// ====================
router.post('/start', protect, async (req, res) => {
  try {
    const { receiverId, orderId } = req.body;
    const senderId = req.user._id || req.user.id;

    if (!receiverId) {
      return res.status(400).json({
        message: 'receiverId é obrigatório'
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        orderId: orderId || null,
        lastMessageAt: new Date()
      });

      console.log('✅ Nova conversa criada:', conversation._id);
    }

    res.json({
      success: true,
      conversation
    });
  } catch (err) {
    console.error('Erro ao iniciar chat:', err);
    res.status(500).json({
      message: 'Erro ao iniciar conversa'
    });
  }
});

// ====================
// BUSCAR MENSAGENS
// ====================
router.get(
  '/:conversationId/messages',
  protect,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const messages = await Message.find({
        conversationId
      })
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        messages
      });
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);

      res.status(500).json({
        message: 'Erro ao buscar mensagens'
      });
    }
  }
);

module.exports = router;