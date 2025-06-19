// backend/models/ProfessionalProfile.js
const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [{ type: String, required: true }], // Exemplo: ['eletricista', 'encanador']
  description: { type: String },
  price: { type: Number },
  address: { type: String },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now },
});

// Índice geoespacial para consultas de proximidade
professionalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Professional', professionalSchema);
