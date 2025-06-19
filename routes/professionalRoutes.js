const express = require('express');
const router = express.Router();
const Professional = require('../models/Professional');
const User = require('../models/User');
const Review = require('../models/Review');

// Rota para buscar perfil completo de um profissional, com avaliações
router.get('/:id', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('user', 'name photo email')
      .lean();

    if (!professional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }

    // Buscar avaliações relacionadas a esse profissional
    const reviews = await Review.find({ professional: professional._id })
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Mapear as avaliações para enviar nome do cliente + nota + comentário
    professional.reviews = reviews.map(r => ({
      user: r.client.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt
    }));

    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar perfil do profissional' });
  }
});

module.exports = router;
