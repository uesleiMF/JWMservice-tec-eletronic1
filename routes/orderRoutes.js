const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware'); // certifique-se que o middleware se chama authMiddleware.js e exporta auth

// Criar pedido
router.post('/', auth, async (req, res) => {
  try {
    const { professionalId, service, location } = req.body;

    const order = new Order({
      client: req.user.id,
      professional: professionalId,
      service,
      location,
      status: 'pendente',
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

// Atualizar status do pedido
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (order.professional.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

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

// Deletar pedido - só cliente dono pode deletar
router.delete('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id.toString(); // Correção aqui

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    // Verifica se o cliente do pedido é o mesmo usuário autenticado
    if (order.client.toString() !== userId) {
      return res.status(403).json({ message: 'Sem permissão para deletar este pedido' });
    }

    await order.deleteOne(); // Alternativa ao deprecated `.remove()`
    return res.status(200).json({ message: 'Pedido deletado com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao deletar pedido' });
  }
});

module.exports = router;
