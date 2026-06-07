const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');

// ====================== CRIAR PEDIDO + CONVERSA ======================
router.post('/', async (req, res) => {
  const { clienteId, profissionalId, servico, descricao, valor } = req.body;

  if (!clienteId || !profissionalId || !servico) {
    return res.status(400).json({ message: 'Cliente, Profissional e Serviço são obrigatórios' });
  }

  try {
    // 1. Criar Pedido
    const newOrder = new Order({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao ? descricao.trim() : '',
      valor: valor || 0,
      status: 'pendente'
    });

    await newOrder.save();

    // 2. Criar Conversa
    const newConversation = new Conversation({
      participants: [clienteId, profissionalId],
      order: newOrder._id,
    });

    await newConversation.save();

    // 3. Vincular conversa no pedido
    newOrder.conversation = newConversation._id;
    await newOrder.save();

    // 4. Retornar dados completos
    const orderPopulated = await Order.findById(newOrder._id)
      .populate('cliente', 'name email phone avatar')
      .populate('profissional', 'name email phone avatar');

    res.status(201).json({
      success: true,
      order: orderPopulated,
      conversation: newConversation
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// ====================== OUTRAS ROTAS ======================
router.get('/professional/:id', async (req, res) => {
  try {
    const orders = await Order.find({ profissional: req.params.id })
      .populate('cliente', 'name email phone avatar')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
});

// Aceitar Pedido
router.patch('/:id/aceitar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.status !== 'pendente') {
      return res.status(400).json({ message: `Status atual: ${order.status}. Não pode aceitar.` });
    }

    order.status = 'em_andamento';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('cliente', 'name email phone avatar');

    res.json({ message: 'Pedido aceito com sucesso!', order: updated });
  } catch (err) {
    console.error('Erro ao aceitar pedido:', err);
    res.status(500).json({ message: 'Erro ao aceitar pedido' });
  }
});

// Recusar Pedido
router.patch('/:id/recusar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    order.status = 'recusado';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('cliente', 'name email phone avatar');

    res.json({ message: 'Pedido recusado com sucesso!', order: updated });
  } catch (err) {
    console.error('Erro ao recusar pedido:', err);
    res.status(500).json({ message: 'Erro ao recusar pedido' });
  }
});

// Iniciar Serviço
router.patch('/:id/iniciar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.status !== 'aceito') {
      return res.status(400).json({ message: 'Só pedidos aceitos podem ser iniciados' });
    }

    order.status = 'em_andamento';
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('cliente', 'name email phone avatar');

    res.json({ message: 'Serviço iniciado!', order: updated });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao iniciar serviço' });
  }
});

// Finalizar Serviço
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    order.status = 'finalizado';
    order.dataFinalizacao = new Date();
    await order.save();

    res.json({ message: 'Serviço finalizado com sucesso!', order });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao finalizar serviço' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;