const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// Enviar mensagem
router.post('/:orderId', auth, async (req, res) => {
  const { text } = req.body;
  const message = new Message({
    order: req.params.orderId,
    sender: req.user.id,
    text
  });
  await message.save();
  res.status(201).json(message);
});

// Buscar mensagens de um pedido
router.get('/:orderId', auth, async (req, res) => {
  const messages = await Message.find({ order: req.params.orderId })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });

  res.json(messages);
});

module.exports = router;
