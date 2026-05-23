const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,        // ← Isso já cria o índice
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['cliente', 'profissional'],
    required: true
  },
  phone: String,
  servico: String,
  latitude: Number,
  longitude: Number
}, {
  timestamps: true
});

// Apenas índices necessários (remova o de email)
UserSchema.index({ role: 1 });
UserSchema.index({ latitude: 1, longitude: 1 });

UserSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);