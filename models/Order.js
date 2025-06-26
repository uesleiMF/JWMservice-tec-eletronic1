const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  description: String,
  status: { type: String, enum: ['pendente', 'aceito', 'finalizado'], default: 'pendente' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
