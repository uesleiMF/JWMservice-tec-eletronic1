const Order = require('../models/Order');
const Conversation = require('../models/Conversation');

// ======================================================
// CRIAR PEDIDO + CONVERSA (VERSÃO SEGURA)
// ======================================================

exports.createOrder = async (req, res) => {
  try {

    const {
      profissionalId,
      servico,
      descricao,
      valor
    } = req.body;

    const clienteId = req.user._id; // 🔥 agora vem do token

    if (!profissionalId || !servico) {
      return res.status(400).json({
        message: 'Profissional e serviço são obrigatórios'
      });
    }

    // ======================================================
    // 1. CRIAR PEDIDO
    // ======================================================

    const newOrder = await Order.create({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao?.trim() || '',
      valor: valor || 0,
      status: 'pendente'
    });

    // ======================================================
    // 2. CRIAR CONVERSA
    // ======================================================

    const newConversation = await Conversation.create({
      participants: [clienteId, profissionalId],
      order: newOrder._id
    });

    // ======================================================
    // 3. VINCULAR CONVERSA NO PEDIDO
    // ======================================================

    newOrder.conversation = newConversation._id;
    await newOrder.save();

    // ======================================================
    // 4. POPULAR RESPOSTA
    // ======================================================

    const orderPopulated = await Order.findById(newOrder._id)
      .populate('cliente', 'name email phone foto')
      .populate('profissional', 'name email phone foto servico avaliacaoMedia');

    res.status(201).json({
      success: true,
      order: orderPopulated,
      conversation: newConversation
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);

    res.status(500).json({
      message: 'Erro ao criar pedido',
      error: err.message
    });
  }
};