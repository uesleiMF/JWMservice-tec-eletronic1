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

  phone: String,
  servico: String,

  // ==============================
  // 📌 LEGADO (SEU SISTEMA ATUAL)
  // ==============================
  latitude: Number,
  longitude: Number,

  // ==============================
  // 🗺️ GEOLOCATION MODERNA (UPGRADE UBER)
  // ==============================
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: undefined
    }
  },

  // ==============================
  // ⚡ STATUS ONLINE (MAPA + SOCKET)
  // ==============================
  isOnline: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});


// ==============================
// 📊 ÍNDICES DE PERFORMANCE
// ==============================
UserSchema.index({ role: 1 });
UserSchema.index({ latitude: 1, longitude: 1 }); // legado
UserSchema.index({ location: '2dsphere' }); // futuro (mapa avançado)


// ==============================
// 🔐 AUTENTICAÇÃO
// ==============================
UserSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);