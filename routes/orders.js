const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ====================== ROTAS ======================

// Criar novo pedido
router.post('/', async (req, res) => {
  const { clienteId, profissionalId, servico, descricao, valor } = req.body;

  if (!clienteId || !profissionalId || !servico) {
    return res.status(400).json({ message: 'Cliente, Profissional e Serviço são obrigatórios' });
  }

  try {
    const newOrder = new Order({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao ? descricao.trim() : '',
      valor: valor || 0,
      status: 'pendente'
    });

    await newOrder.save();

    const orderPopulated = await Order.findById(newOrder._id)
      .populate('cliente', 'name email phone');

    res.status(201).json(orderPopulated);
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// Buscar pedidos do profissional
router.get('/professional/:id', async (req, res) => {
  try {
    const orders = await Order.find({ profissional: req.params.id })
      .populate('cliente', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
});

// Recusar pedido
router.patch('/:id/recusar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // regra de negócio (profissional só pode recusar se ainda não começou)
    if (!['pendente', 'em_andamento'].includes(order.status)) {
      return res.status(400).json({
        message: `Não é possível recusar um pedido com status: ${order.status}`
      });
    }

    order.status = 'recusado';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('cliente', 'name email phone');

    return res.json({
      message: 'Pedido recusado com sucesso!',
      order: updated
    });

  } catch (err) {
    console.error('Erro ao recusar pedido:', err);
    return res.status(500).json({
      message: 'Erro interno ao recusar pedido'
    });
  }
});




// Aceitar pedido
router.patch('/:id/aceitar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.status !== 'pendente') {
      return res.status(400).json({ message: `Status atual: ${order.status}. Não pode aceitar.` });
    }

    order.status = 'em_andamento';
    await order.save();

    const orderPopulated = await Order.findById(order._id)
      .populate('cliente', 'name email phone');

    res.json({ message: 'Pedido aceito com sucesso!', order: orderPopulated });
  } catch (err) {
    console.error('Erro ao aceitar pedido:', err);
    res.status(500).json({ message: 'Erro ao aceitar pedido' });
  }
});

// Finalizar pedido
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.status === 'finalizado') {
      return res.status(400).json({ message: 'Pedido já finalizado' });
    }

    order.status = 'finalizado';
    order.dataFinalizacao = new Date();
    await order.save();

    res.json({ message: 'Serviço finalizado com sucesso!', order });
  } catch (err) {
    console.error('Erro ao finalizar:', err);
    res.status(500).json({ message: 'Erro ao finalizar serviço' });
  }
});

// Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar pedido:', err);
    res.status(500).json({ message: 'Erro ao deletar pedido' });
  }
});

module.exports = router;