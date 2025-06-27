const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, enum: ['cliente', 'profissional'], required: true },
  cpfCnpj: String,
  serviceAreas: [String],
  description: String,
  availability: [{
    day: String,
    from: String,
    to: String
  }],
  location: {
    address: String,
    coordinates: { type: [Number], index: '2dsphere' }
  },
  paypalAccount: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
