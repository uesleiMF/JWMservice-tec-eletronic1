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

// ====================== BUSCAR MENSAGENS =====================

exports.getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    console.log(`🔍 [BACKEND] Buscando mensagens - Conv: ${conversationId} | User: ${userId}`);

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      console.log('❌ Conversa não encontrada');
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    console.log('✅ Conversa encontrada:', {
      id: conversation._id,
      participants: conversation.participants?.length || 0
    });

    // Verificação mais simples e confiável
    const isParticipant = conversation.participants.some(
      p => String(p) === String(userId)
    );

    if (!isParticipant) {
      console.log('❌ Usuário não é participante');
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    console.log(`✅ ${messages.length} mensagens encontradas`);
    res.json({ messages });

  } catch (err) {
    console.error('❌ Erro ao buscar mensagens:', err);
    res.status(500).json({ message: 'Erro interno ao carregar mensagens' });
  }
};

// ====================== CRIAR CONVERSA (adicionei para ajudar) ======================
exports.createConversation = async (req, res) => {
  try {

    const { clientId, profissionalId, orderId } = req.body;


    if (!clientId || !profissionalId) {
      return res.status(400).json({
        message: 'clientId e profissionalId são obrigatórios'
      });
    }


    // procura conversa existente independente da ordem
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          clientId,
          profissionalId
        ]
      }
    });


    if (conversation) {

      console.log(
        '✅ Conversa encontrada:',
        conversation._id
      );

      return res.json({
        conversation
      });

    }



    // cria nova somente se não existir

    conversation = await Conversation.create({

      participants: [
        clientId,
        profissionalId
      ],

      client: clientId,

      profissional: profissionalId,

      orderId: orderId || null,

      lastMessageAt: new Date()

    });



    console.log(
      '🆕 Nova conversa criada:',
      conversation._id
    );


    res.status(201).json({

      message:
      'Conversa criada com sucesso',

      conversation

    });



  } catch(err) {

    console.error(
      '❌ Erro ao criar conversa:',
      err
    );


    res.status(500).json({

      message:
      'Erro ao criar conversa'

    });

  }
};