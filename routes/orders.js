const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// CRIAR PEDIDO + CONVERSA (SEGURO)
// ======================================================

router.post('/', protect, async (req, res) => {
  try {

    const { profissionalId, servico, descricao, valor } = req.body;

    const clienteId = req.user._id;

    if (!profissionalId || !servico) {
      return res.status(400).json({
        message: 'Profissional e serviço são obrigatórios'
      });
    }

    const newOrder = await Order.create({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao?.trim() || '',
      valor: valor || 0,
      status: 'pendente'
    });

    const newConversation = await Conversation.create({
      participants: [clienteId, profissionalId],
      order: newOrder._id
    });

    newOrder.conversation = newConversation._id;
    await newOrder.save();

    const orderPopulated = await Order.findById(newOrder._id)
      .populate('cliente', 'name email phone foto')
      .populate('profissional', 'name email phone foto');

    res.status(201).json({
      success: true,
      order: orderPopulated,
      conversation: newConversation
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// ======================================================
// PEDIDOS DO PROFISSIONAL
// ======================================================

router.get('/professional/:id', protect, async (req, res) => {
  try {

    const orders = await Order.find({
      profissional: req.params.id
    })
      .populate('cliente', 'name email phone foto')
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
});

// ======================================================
// ACEITAR PEDIDO
// ======================================================

router.patch('/:id/aceitar', protect, async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // 🔥 segurança: só profissional dono pode aceitar
    if (order.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (order.status !== 'pendente') {
      return res.status(400).json({ message: 'Pedido já foi processado' });
    }

    order.status = 'aceito';
    await order.save();

    res.json({
      message: 'Pedido aceito com sucesso',
      order
    });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao aceitar pedido' });
  }
});

// ======================================================
// RECUSAR PEDIDO
// ======================================================

router.patch('/:id/recusar', protect, async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (order.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    order.status = 'recusado';
    await order.save();

    res.json({
      message: 'Pedido recusado',
      order
    });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao recusar pedido' });
  }
});

// ======================================================
// INICIAR SERVIÇO
// ======================================================

router.patch('/:id/iniciar', protect, async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (order.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (order.status !== 'aceito') {
      return res.status(400).json({ message: 'Pedido precisa estar aceito' });
    }

    order.status = 'em_andamento';
    await order.save();

    res.json({
      message: 'Serviço iniciado',
      order
    });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao iniciar serviço' });
  }
});

// ======================================================
// FINALIZAR SERVIÇO
// ======================================================

router.patch('/:id/finalizar', protect, async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (order.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    order.status = 'finalizado';
    order.dataFinalizacao = new Date();

    await order.save();

    res.json({
      message: 'Serviço finalizado',
      order
    });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao finalizar serviço' });
  }
});

// ======================================================
// DELETE (SEGURANÇA)
// ======================================================

router.delete('/:id', protect, async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    if (order.cliente.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await order.deleteOne();

    res.json({ message: 'Pedido deletado com sucesso' });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar pedido' });
  }
});

module.exports = router;