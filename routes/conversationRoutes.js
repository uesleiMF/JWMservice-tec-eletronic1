const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

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
        $sort: {
          createdAt: -1
        }
      },

      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$text" },
          lastDate: { $first: "$createdAt" },
          senderId: { $first: "$senderId" },
          receiverId: { $first: "$receiverId" }
        }
      },

      {
        $sort: {
          lastDate: -1
        }
      }
    ]);

    const inbox = await Promise.all(
      conversations.map(async (conv) => {

        const otherUserId =
          conv.senderId.toString() === userId
            ? conv.receiverId
            : conv.senderId;

        const otherUser = await User.findById(otherUserId)
          .select('name email avatar role');

        return {
          conversationId: conv._id,
          lastMessage: conv.lastMessage,
          lastDate: conv.lastDate,
          user: otherUser
        };
      })
    );

    res.json(inbox);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Erro ao buscar conversas'
    });
  }
});

module.exports = router;