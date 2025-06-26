const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialty: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  paid: { type: Boolean, default: false },
}, { timestamps: true });

professionalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Professional', professionalSchema);
