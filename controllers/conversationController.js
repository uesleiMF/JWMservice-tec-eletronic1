const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Criar ou pegar conversa existente
// @route   POST /api/conversations
const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId, orderId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId é obrigatório' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        orderId: orderId || null
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Listar todas as conversas do usuário (melhorada para painel)
// @route   GET /api/conversations
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      status: 'active'
    })
      .populate('participants', 'name avatar profession role')
      .populate('lastMessage', 'text createdAt senderId')
      .populate('orderId', 'title serviceStatus price') // dados do pedido
      .sort({ lastMessageAt: -1 });

    // Formatação amigável para o frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId
      );

      return {
        _id: conv._id,
        orderId: conv.orderId?._id || null,
        orderTitle: conv.orderId?.title || null,
        otherParticipant: {
          id: otherParticipant?._id,
          name: otherParticipant?.name,
          avatar: otherParticipant?.avatar,
          profession: otherParticipant?.profession,
          role: otherParticipant?.role
        },
        lastMessage: conv.lastMessage ? {
          text: conv.lastMessage.text,
          createdAt: conv.lastMessage.createdAt,
          isFromMe: conv.lastMessage.senderId?.toString() === userId
        } : null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount?.get(userId) || 0,
        status: conv.status
      };
    });

    res.status(200).json({
      conversations: formattedConversations,
      total: formattedConversations.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buscar uma conversa específica + mensagens
// @route   GET /api/conversations/:conversationId
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'name avatar profession role');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 });

    res.status(200).json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enviar mensagem via HTTP
// @route   POST /api/conversations/:conversationId/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    if (!conversation.participants.some(p => p.toString() === senderId)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const receiverId = conversation.participants.find(p => p.toString() !== senderId);

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim()
    });

    // Atualiza última mensagem da conversa
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
  sendMessage
};