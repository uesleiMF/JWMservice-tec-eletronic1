// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profissional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  servico: { type: String, required: true },
  status: { type: String, enum: ['pendente', 'em andamento', 'finalizado'], default: 'pendente' },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
