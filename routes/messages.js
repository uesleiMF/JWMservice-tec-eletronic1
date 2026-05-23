const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// SALVAR MENSAGEM
router.post('/', async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// BUSCAR MENSAGENS POR PEDIDO
router.get('/:orderId', async (req, res) => {
  try {
    const messages = await Message.find({
      orderId: req.params.orderId
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;