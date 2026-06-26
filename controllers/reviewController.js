const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

// ======================================================
// CRIAR AVALIAÇÃO (VERSÃO FINAL)
// ======================================================

const createReview = async (req, res) => {
  try {

    const { orderId, rating, comment } = req.body;

    const clientId = req.user._id;

    if (!orderId || !rating) {
      return res.status(400).json({
        message: 'orderId e rating são obrigatórios'
      });
    }

    // ===============================
    // VERIFICAR PEDIDO
    // ===============================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Pedido não encontrado'
      });
    }

    // 🔥 só pode avaliar pedido finalizado
    if (order.status !== 'finalizado') {
      return res.status(400).json({
        message: 'Só é possível avaliar serviços finalizados'
      });
    }

    if (order.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        message: 'Você só pode avaliar seus próprios pedidos'
      });
    }

    // ===============================
    // EVITAR DUPLICIDADE
    // ===============================

    const existingReview = await Review.findOne({ orderId });

    if (existingReview) {
      return res.status(400).json({
        message: 'Este pedido já foi avaliado'
      });
    }

    // ===============================
    // CRIAR REVIEW
    // ===============================

    const review = await Review.create({
      orderId,
      clientId,
      professionalId: order.professional,
      rating,
      comment
    });

    // ===============================
    // ATUALIZAR PROFISSIONAL (OTIMIZADO)
    // ===============================

    const stats = await Review.aggregate([
      { $match: { professionalId: order.professional } },
      {
        $group: {
          _id: '$professionalId',
          total: { $sum: 1 },
          media: { $avg: '$rating' }
        }
      }
    ]);

    const total = stats[0]?.total || 0;
    const media = stats[0]?.media || 0;

    await User.findByIdAndUpdate(order.professional, {
      avaliacaoMedia: Number(media.toFixed(1)),
      totalAvaliacoes: total
    });

    res.status(201).json({
      message: 'Avaliação criada com sucesso',
      review
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Erro ao criar avaliação',
      error: error.message
    });
  }
};

// ======================================================
// LISTAR AVALIAÇÕES
// ======================================================

const getProfessionalReviews = async (req, res) => {
  try {

    const { professionalId } = req.params;

    const reviews = await Review.find({ professionalId })
      .populate('clientId', 'name foto')
      .sort({ createdAt: -1 });

    // 🔥 usa dados reais do User (mais confiável)
    const professional = await User.findById(professionalId)
      .select('avaliacaoMedia totalAvaliacoes');

    res.json({
      reviews,
      averageRating: professional?.avaliacaoMedia || 0,
      totalReviews: professional?.totalAvaliacoes || 0
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Erro ao buscar avaliações',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getProfessionalReviews
};