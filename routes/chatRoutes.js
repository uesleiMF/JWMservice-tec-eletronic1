const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/authMiddleware');

// Enviar mensagem
router.post('/:orderId', auth, async (req, res) => {
  const { text } = req.body;
  const { orderId } = req.params;

  if (!text) return res.status(400).json({ message: 'Mensagem vazia' });

  try {
    const message = new Message({
      orderId,
      sender: req.user.id,
      text,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Buscar mensagens de um pedido
router.get('/:orderId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ orderId: req.params.orderId }).sort('createdAt').populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;
