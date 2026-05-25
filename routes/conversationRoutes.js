const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');

// 📩 INBOX - LISTA DE CONVERSAS
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },

      {
        $group: {
          _id: "$orderId",
          lastMessage: { $last: "$text" },
          lastDate: { $last: "$createdAt" },
          senderId: { $last: "$senderId" },
          receiverId: { $last: "$receiverId" }
        }
      },

      { $sort: { lastDate: -1 } }
    ]);

    res.json(conversations);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

module.exports = router;