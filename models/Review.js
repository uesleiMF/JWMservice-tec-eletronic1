const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Para evitar que o mesmo cliente avalie o mesmo profissional várias vezes no mesmo pedido
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
ReviewSchema.index({ orderId: 1 }, { unique: true });
ReviewSchema.index({ professionalId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);