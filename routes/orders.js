const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Conversation = require('../models/Conversation'); // ← Adicione isso

// ====================== ROTAS ======================
// Criar novo pedido + conversa
router.post('/', async (req, res) => {
  const { clienteId, profissionalId, servico, descricao, valor } = req.body;

  if (!clienteId || !profissionalId || !servico) {
    return res.status(400).json({ message: 'Cliente, Profissional e Serviço são obrigatórios' });
  }

  try {
    // 1. Criar o Pedido
    const newOrder = new Order({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao ? descricao.trim() : '',
      valor: valor || 0,
      status: 'pendente'
    });

    await newOrder.save();

    // 2. Criar a Conversa vinculada ao pedido
    const newConversation = new Conversation({
      participants: [clienteId, profissionalId],
      order: newOrder._id,
      messages: []
    });

    await newConversation.save();

    // 3. Vincular a conversa no Pedido (opcional, mas recomendado)
    newOrder.conversation = newConversation._id;
    await newOrder.save();

    // 4. Retornar tudo populado
    const orderPopulated = await Order.findById(newOrder._id)
      .populate('cliente', 'name email phone avatar')
      .populate('profissional', 'name email phone avatar');

    res.status(201).json({
      success: true,
      order: orderPopulated,
      conversation: newConversation   // ← Isso é o que o frontend precisa!
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// ... (o resto das rotas permanece igual)
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

// Recusar, Aceitar, Finalizar... (mantidos iguais)

module.exports = router;