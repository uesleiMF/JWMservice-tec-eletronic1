const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
// GET /api/orders/professional/:id
router.get('/professional/:id', async (req, res) => {
    try {
      const orders = await Order.find({ profissional: req.params.id }).populate('cliente', 'name email');
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar pedidos do profissional' });
    }
  });
  
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Serviço não encontrado' });

    order.status = 'finalizado';
    await order.save();

    res.json({ message: 'Serviço finalizado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao finalizar serviço' });
  }
});

module.exports = router;
