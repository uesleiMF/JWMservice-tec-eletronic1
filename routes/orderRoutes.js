// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');

// Criar pedido
router.post('/', auth, async (req, res) => {
  try {
    const { professionalId, service, location } = req.body;

    const order = new Order({
      client: req.user.id,
      professional: professionalId,
      service,
      location,
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// Listar pedidos do usuário logado (cliente ou profissional)
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { client: req.user.id },
        { professional: req.user.id }
      ]
    })
    .populate('client', 'name')
    .populate('professional', 'name')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
});

module.exports = router;
