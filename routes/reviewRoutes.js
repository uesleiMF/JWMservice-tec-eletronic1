const express = require('express');
const router = express.Router();
const { 
  createReview, 
  getProfessionalReviews 
} = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware');

// ==================== ROTAS DE AVALIAÇÕES ====================

// Criar uma nova avaliação (apenas o cliente que fez o pedido)
router.post('/', protect, createReview);

// Listar avaliações de um profissional (público ou para perfil)
router.get('/professional/:professionalId', getProfessionalReviews);

module.exports = router;