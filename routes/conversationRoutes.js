// routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversationById,
  getMessages
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

// Rotas existentes
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);

// Rota de teste (SEM PROTECT)
router.get('/:id/test-messages', (req, res) => {
  res.json({ message: 'Rota de teste funcionando!', conversationId: req.params.id });
});

// Rota principal (com protect)
router.get('/:id/messages', protect, getMessages);

module.exports = router;