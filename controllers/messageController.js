const Message = require('../models/Message');

exports.getConversation = async (req, res) => {
  const { orderId } = req.params;        // ← Mudança importante
  const userId = req.user._id;

  try {
    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    const messages = await Message.find({
      orderId: orderId,
      // Opcional: excluir mensagens deletadas
      deletedBySender: false,
      deletedByReceiver: false
    })
    .sort({ createdAt: 1 })           // mais antigas primeiro
    .populate('senderId', 'name photo')   // opcional: trazer dados do usuário
    .populate('receiverId', 'name photo');

    res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar conversa:', err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};