const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /api/orders
router.post('/', async (req, res) => {
    const { clienteId, profissionalId, servico } = req.body;
    console.log('📦 Dados recebidos no pedido:', req.body); // 👈 ADICIONE ISSO
    try {
      const newOrder = new Order({
        cliente: clienteId,
        profissional: profissionalId,
        servico,
        status: 'pendente'
      });
  
      await newOrder.save();
      res.status(201).json(newOrder);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao criar pedido' });
    }
  });
  
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
