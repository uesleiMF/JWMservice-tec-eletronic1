const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ====================== LISTAR CONVERSAS DO USUÁRIO ======================
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email phone role')
    .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (err) {
    console.error('Erro ao buscar conversas:', err);
    res.status(500).json({ message: 'Erro ao carregar conversas' });
  }
};

// ====================== BUSCAR UMA CONVERSA ESPECÍFICA ======================
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email phone role');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    const isParticipant = conversation.participants.some(
      p => String(p._id) === String(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Acesso negado a esta conversa' });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('Erro ao buscar conversa:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
};

// ====================== BUSCAR MENSAGENS (ATUALIZADO) ======================
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;           // conversationId
    const userId = req.user.id || req.user._id;

    console.log(`🔍 Buscando mensagens da conversa: ${id} | Usuário: ${userId}`);

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      console.log('❌ Conversa não encontrada no banco');
      return res.status(404).json({ 
        message: 'Conversa não encontrada',
        conversationId: id 
      });
    }

    // Verifica se o usuário participa da conversa
    const isParticipant = conversation.participants.some(
      p => String(p) === String(userId)
    );

    if (!isParticipant) {
      console.log('❌ Usuário não é participante');
      return res.status(403).json({ message: 'Acesso negado a esta conversa' });
    }

    // Busca as mensagens
    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 });

    console.log(`✅ ${messages.length} mensagens encontradas`);

    res.json({ 
      messages,
      conversation: {
        _id: conversation._id,
        participants: conversation.participants
      }
    });

  } catch (err) {
    console.error('❌ Erro ao buscar mensagens:', err);
    res.status(500).json({ message: 'Erro ao carregar histórico' });
  }
};