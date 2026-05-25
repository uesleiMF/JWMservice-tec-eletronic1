const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ==================== MIDDLEWARE ====================
// const authMiddleware = require('../middleware/auth'); // descomente quando criar

// ====================== CRIAR MENSAGEM ======================
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, orderId, text } = req.body;

    if (!senderId || !receiverId || !orderId || !text?.trim()) {
      return res.status(400).json({
        error: 'Campos obrigatórios: senderId, receiverId, orderId e text'
      });
    }

    const msg = await Message.create({
      senderId,
      receiverId,
      orderId,
      text: text.trim(),
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err);
    res.status(500).json({ error: 'Erro interno ao salvar mensagem' });
  }
});

// ====================== BUSCAR MENSAGENS ======================
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { limit = 50, page = 1 } = req.query; // Suporte a paginação

    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    const messages = await Message.find({ orderId })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Opcional: trazer nome do remetente
    // .populate('senderId', 'name photo')

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// ====================== MARCAR COMO LIDA ======================
router.patch('/:orderId/read', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body; // ID de quem está lendo

    await Message.updateMany(
      { 
        orderId, 
        receiverId: userId,
        read: false 
      },
      { read: true }
    );

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
});

// ====================== DELETAR MENSAGEM ======================
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const deleted = await Message.findByIdAndDelete(messageId);

    if (!deleted) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    res.json({ message: 'Mensagem deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar mensagem' });
  }
});

module.exports = router;