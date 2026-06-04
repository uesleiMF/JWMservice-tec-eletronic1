const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Listar todas as conversas do usuário
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email phone')
    .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (err) {
    console.error('Erro ao buscar conversas:', err);
    res.status(500).json({ message: 'Erro ao carregar conversas' });
  }
};

// Buscar uma conversa específica
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email phone');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    // Verifica se o usuário participa da conversa
    if (!conversation.participants.some(p => String(p._id) === String(userId))) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('Erro ao buscar conversa:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
};

// Buscar mensagens de uma conversa (ROTA PROBLEMÁTICA)
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;           // conversationId
    const userId = req.user.id || req.user._id;

    console.log(`🔍 Buscando mensagens da conversa: ${id} | Usuário: ${userId}`);

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      console.log('❌ Conversa não encontrada no banco');
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    // Verificação de permissão
    const isParticipant = conversation.participants.some(
      p => String(p) === String(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Acesso negado a esta conversa' });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error('❌ Erro ao buscar mensagens:', err);
    res.status(500).json({ message: 'Erro ao carregar histórico' });
  }
};