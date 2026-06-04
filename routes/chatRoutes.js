const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, orderId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      orderId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        orderId
      });
    }

    res.json({ conversation });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Erro ao iniciar conversa'
    });
  }
});

module.exports = router;