const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /api/orders - Criar novo pedido
router.post('/', async (req, res) => {
  const { clienteId, profissionalId, servico } = req.body;

  console.log('📦 Novo pedido recebido:', req.body);

  if (!clienteId || !profissionalId || !servico) {
    return res.status(400).json({ message: 'Cliente, Profissional e Serviço são obrigatórios' });
  }

  try {
    const newOrder = new Order({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      status: 'pendente'
    });

    await newOrder.save();

    // Popula os dados do cliente ao retornar
    const orderPopulated = await Order.findById(newOrder._id).populate('cliente', 'name email');

    res.status(201).json(orderPopulated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// GET /api/orders/professional/:id - Pedidos de um profissional
router.get('/professional/:id', async (req, res) => {
  try {
    const orders = await Order.find({ profissional: req.params.id })
      .populate('cliente', 'name email phone')
      .sort({ createdAt: -1 }); // Mais recentes primeiro

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar pedidos do profissional' });
  }
});

// PATCH /api/orders/:id/finalizar - Finalizar serviço
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (order.status === 'finalizado') {
      return res.status(400).json({ message: 'Este serviço já foi finalizado' });
    }

    order.status = 'finalizado';
    order.dataFinalizacao = new Date(); // Opcional: registrar data

    await order.save();

    res.json({ 
      message: 'Serviço finalizado com sucesso',
      order 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao finalizar serviço' });
  }
});

module.exports = router;
