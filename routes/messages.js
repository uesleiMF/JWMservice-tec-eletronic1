const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ======================
// CRIAR MENSAGEM
// ======================
router.post('/', async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      conversationId,
      text
    } = req.body;

    if (
      !senderId ||
      !receiverId ||
      !conversationId ||
      !text?.trim()
    ) {
      return res.status(400).json({
        error:
          'Campos obrigatórios: senderId, receiverId, conversationId e text'
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      conversationId,
      text: text.trim()
    });

    res.status(201).json(message);

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
      .sort({ createdAt: 1 })
      .lean();

    res.json({
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