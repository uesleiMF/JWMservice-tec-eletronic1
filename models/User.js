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
    unique: true,
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
    required: true,
    index: true
  },

  // ==================== CAMPOS DO PROFISSIONAL ====================
  phone: String,
  servico: String,
  especialidade: String,
  descricao: String,           // ← Sobre mim
  experiencia: Number,         // ← Anos de experiência
  foto: String,                // ← URL da foto
  city: String,
  state: String,
  avaliacao: Number,           // ← Nota média

  // Geolocalização (legado)
  latitude: Number,
  longitude: Number,

  // Geolocalização moderna (futuro)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  },

  // Status online
  isOnline: {
    type: Boolean,
    default: false
  },

}, {
  timestamps: true
});

// Índices
UserSchema.index({ role: 1 });
UserSchema.index({ latitude: 1, longitude: 1 });
UserSchema.index({ location: '2dsphere' });

UserSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);