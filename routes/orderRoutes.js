/// routes/orderRoutes.js
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
      status: 'pendente', // opcional: definir status inicial
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

// **Adicionar rota para atualizar status do pedido**
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Opcional: só o profissional do pedido pode atualizar o status
    if (order.professional.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Validar status, por exemplo:
    const validStatuses = ['pendente', 'aceito', 'recusado', 'concluído'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar status do pedido' });
  }
});

module.exports = router;
