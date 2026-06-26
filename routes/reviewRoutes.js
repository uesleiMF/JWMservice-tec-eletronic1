const express = require('express');
const router = express.Router();

const {
  createReview,
  getProfessionalReviews
} = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware');

// ======================================================
// CRIAR AVALIAÇÃO (CLIENTE AUTENTICADO)
// ======================================================

router.post('/', protect, createReview);

// ======================================================
// LISTAR AVALIAÇÕES DE UM PROFISSIONAL (PÚBLICO)
// ======================================================

router.get('/professional/:professionalId', getProfessionalReviews);

module.exports = router;