const Order = require('../models/Order');
const Conversation = require('../models/Conversation'); // ← Adicione esta linha

// ====================== CRIAR PEDIDO + CONVERSA ======================
exports.createOrder = async (req, res) => {
  const { clienteId, profissionalId, servico, descricao, valor } = req.body;

  if (!clienteId || !profissionalId || !servico) {
    return res.status(400).json({ 
      message: 'Cliente, Profissional e Serviço são obrigatórios' 
    });
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

    // 2. Criar a Conversa vinculada
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
};

// ====================== DELETE (seu código atual) ======================
exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Pode adicionar as outras funções aqui também (aceitar, recusar, etc.)