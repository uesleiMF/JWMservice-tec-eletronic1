const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const auth = require('../middleware/authMiddleware');

// Criar avaliação (só cliente autenticado pode avaliar)
router.post('/', auth, async (req, res) => {
  try {
    const { professionalId, rating, comment } = req.body;
    if (!professionalId || !rating) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    // Verificar se o cliente já avaliou este profissional para evitar duplicidade (opcional)
    const existingReview = await Review.findOne({ professional: professionalId, client: req.user.id });
    if (existingReview) {
      return res.status(400).json({ message: 'Você já avaliou este profissional' });
    }

    const review = new Review({
      professional: professionalId,
      client: req.user.id,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    res.status(500).json({ message: 'Erro ao criar avaliação' });
  }
});

// Listar avaliações de um profissional
router.get('/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;

    const reviews = await Review.find({ professional: professionalId })
      .populate('client', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ message: 'Erro ao buscar avaliações' });
  }
});

module.exports = router;
