// controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user?._id;

    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }

    console.log(`🔍 Buscando mensagens da conversa: ${conversationId} | Usuário: ${userId}`);

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      console.log('❌ Conversa não encontrada');
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verifica participação (mais flexível)
    const isParticipant = 
      conversation.participants?.some(p => String(p) === String(userId)) ||
      String(conversation.client?._id || conversation.client) === String(userId) ||
      String(conversation.profissional?._id || conversation.profissional) === String(userId);

    if (!isParticipant) {
      console.log('❌ Usuário não é participante');
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    console.log(`✅ ${messages.length} mensagens encontradas`);
    res.json({ messages });

  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro interno ao carregar mensagens' });
  }
};

module.exports = { getMessages };