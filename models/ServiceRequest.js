const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: {
    address: String,
    coordinates: { type: [Number], index: '2dsphere' }
  },
  status: {
    type: String,
    enum: ['pendente', 'aceito', 'em_andamento', 'concluido', 'cancelado'],
    default: 'pendente'
  },
  amount: Number,
  commission: Number,
  paymentStatus: {
    type: String,
    enum: ['nao_pago', 'pago', 'liberado'],
    default: 'nao_pago'
  },
  paypalOrderId: String,
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
