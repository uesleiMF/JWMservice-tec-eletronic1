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

// ====================== BUSCAR MENSAGENS ======================
exports.getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    console.log(`🔍 [BACKEND] Buscando mensagens - Conv: ${conversationId} | User: ${userId}`);

    if (!conversationId) {
      return res.status(400).json({ message: 'ID da conversa é obrigatório' });
    }

    // Busca a conversa SEM os populates problemáticos
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      console.log('❌ Conversa não encontrada no banco');
      return res.status(404).json({ 
        message: 'Conversa não encontrada',
        conversationId 
      });
    }

    console.log('✅ Conversa encontrada:', {
      id: conversation._id,
      participants: conversation.participants?.length || 0,
      client: conversation.client,
      profissional: conversation.profissional
    });

    // Verificação de acesso (flexível)
    const isParticipant = 
      conversation.participants?.some(p => String(p?._id || p) === String(userId)) ||
      String(conversation.client?._id || conversation.client) === String(userId) ||
      String(conversation.profissional?._id || conversation.profissional) === String(userId);

    if (!isParticipant) {
      console.log('❌ Usuário não é participante');
      return res.status(403).json({ message: 'Acesso negado a esta conversa' });
    }

    // Busca as mensagens - MUITO IMPORTANTE: verifique o nome do campo!
    const messages = await Message.find({ conversation: conversationId })  // ← Teste primeiro com "conversation"
      .sort({ createdAt: 1 });

    console.log(`✅ ${messages.length} mensagens encontradas`);
    res.json({ messages });

  } catch (err) {
    console.error('❌ Erro ao buscar mensagens:', err);
    res.status(500).json({ message: 'Erro interno ao carregar mensagens' });
  }
};