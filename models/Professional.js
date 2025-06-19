// backend/models/ProfessionalProfile.js
const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [String],
  description: String,
  price: Number,
  address: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
  // sem necessidade de campo reviews, será populado pela rota
});

professionalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Professional', professionalSchema);
