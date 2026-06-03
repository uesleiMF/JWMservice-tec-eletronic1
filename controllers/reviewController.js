const Review = require('../models/Review');
const Order = require('../models/Order'); // ajuste o caminho se necessário

// Criar avaliação
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const clientId = req.user.id;

    // Verifica se o pedido existe e pertence ao cliente
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    if (order.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Você só pode avaliar seus próprios pedidos' });
    }

    // Verifica se já existe review para este pedido
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ message: 'Este pedido já foi avaliado' });
    }

    const review = await Review.create({
      orderId,
      clientId,
      professionalId: order.professional,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pegar avaliações de um profissional
const getProfessionalReviews = async (req, res) => {
  try {
    const { professionalId } = req.params;

    const reviews = await Review.find({ professionalId })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });

    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      reviews,
      averageRating: Number(averageRating),
      totalReviews: reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getProfessionalReviews
};