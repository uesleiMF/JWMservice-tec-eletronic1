// controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Listar todas as conversas do usuário
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'name avatar role',
        match: { _id: { $ne: userId } }
      })
      .populate('lastMessage', 'text createdAt')
      .sort({ lastMessageAt: -1 });

    const formatted = conversations.map(conv => {
      const otherUser = conv.participants.find(p => p && String(p._id) !== String(userId));
      return {
        _id: conv._id,
        client: otherUser ? {
          id: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar
        } : {},
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar conversas' });
  }
};

// Buscar histórico de mensagens
const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    // Verifica se o usuário participa da conversa
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Acesso negado a esta conversa' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar');

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Erro getMessages:', error);
    res.status(500).json({ message: 'Erro ao carregar mensagens' });
  }
};

module.exports = {
  getConversations,
  getConversationById: async (req, res) => {
    res.json({ message: "Rota em desenvolvimento" });
  },
  getMessages
};