const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/authMiddleware');

// routes/chatRoutes.js
router.post('/start', protect, async (req, res) => {
  try {
    const { receiverId, orderId } = req.body;
    const senderId = req.user._id || req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId é obrigatório' });
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
    res.status(500).json({ message: 'Erro ao iniciar conversa' });
  }
});

module.exports = router;