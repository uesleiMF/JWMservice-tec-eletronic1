const express = require('express');
const router = express.Router();

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ======================
// CRIAR MENSAGEM
// ======================
router.post('/', async (req, res) => {
  try {

    const {
      senderId,
      receiverId,
      text
    } = req.body;

    if (
      !senderId ||
      !receiverId ||
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        error: 'senderId, receiverId e text são obrigatórios'
      });
    }

    // Procura conversa existente
    let conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId]
      }
    });

    // Cria conversa caso não exista
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    // Cria mensagem
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      text: text.trim()
    });

    // Atualiza dados da conversa
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    res.status(201).json({
      success: true,
      conversationId: conversation._id,
      message
    });

  } catch (err) {

    console.error('Erro ao salvar mensagem:', err);

    res.status(500).json({
      error: 'Erro interno ao salvar mensagem'
    });
  }
});

// ======================
// BUSCAR HISTÓRICO
// ======================
router.get('/:conversationId', async (req, res) => {
  try {

    const { conversationId } = req.params;

    const messages = await Message.find({
      conversationId
    })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });

  } catch (err) {

    console.error('Erro ao buscar mensagens:', err);

    res.status(500).json({
      error: 'Erro ao buscar mensagens'
    });
  }
});

// ======================
// DELETAR MENSAGEM
// ======================
router.delete('/:messageId', async (req, res) => {
  try {

    const deleted = await Message.findByIdAndDelete(
      req.params.messageId
    );

    if (!deleted) {
      return res.status(404).json({
        error: 'Mensagem não encontrada'
      });
    }

    res.json({
      message: 'Mensagem deletada com sucesso'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Erro ao deletar mensagem'
    });
  }
});

module.exports = router;