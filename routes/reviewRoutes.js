const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Criar avaliação para profissional
router.post('/:professionalId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { professionalId } = req.params;

    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Apenas clientes podem avaliar' });
    }

    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== 'professional') {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }

    // Verifica se cliente já avaliou (opcional)
    const alreadyReviewed = professional.reviews.some(
      r => r.user.toString() === req.user.id
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Você já avaliou este profissional' });
    }

    professional.reviews.push({
      user: req.user.id,
      rating,
      comment,
    });

    await professional.save();

    res.status(201).json({ message: 'Avaliação adicionada' });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Listar avaliações do profissional
router.get('/:professionalId', async (req, res) => {
  try {
    const professional = await User.findById(req.params.professionalId)
      .select('reviews')
      .populate('reviews.user', 'name photoUrl');

    if (!professional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }

    res.json(professional.reviews);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
