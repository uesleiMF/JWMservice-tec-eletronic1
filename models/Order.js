// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, required: true },
  status: { type: String, enum: ['pendente', 'aceito','recusado', 'concluído'], default: 'pendente' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
