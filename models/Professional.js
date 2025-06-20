const mongoose = require('mongoose');

const ProfessionalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [String],
  description: String,
  price: Number,
  address: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  photos: [String], // URLs/caminhos das fotos
}, { timestamps: true });

ProfessionalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Professional', ProfessionalSchema);
