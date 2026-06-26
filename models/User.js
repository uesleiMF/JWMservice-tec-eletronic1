const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PortfolioSchema = new mongoose.Schema(
{
  foto: String,
  descricao: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
},
{ _id: false });

const HorarioSchema = new mongoose.Schema(
{
  dia: String,
  inicio: String,
  fim: String
},
{ _id: false });

const CertificadoSchema = new mongoose.Schema(
{
  titulo: String,
  instituicao: String,
  ano: Number
},
{ _id: false });

const UserSchema = new mongoose.Schema({

  // ==========================
  // DADOS BÁSICOS
  // ==========================

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

  // ==========================
  // DADOS DO PROFISSIONAL
  // ==========================

  phone: String,

  servico: String,

  especialidade: String,

  especialidades: [{
    type: String
  }],

  descricao: String,

  experiencia: {
    type: Number,
    default: 0
  },

  foto: String,

  city: String,

  state: String,

  precoInicial: {
    type: Number,
    default: 0
  },

  raioAtendimento: {
    type: Number,
    default: 15
  },

  // ==========================
  // AVALIAÇÕES
  // ==========================

  avaliacaoMedia: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  totalAvaliacoes: {
    type: Number,
    default: 0
  },

  // Compatibilidade com código antigo
  avaliacao: {
    type: Number,
    default: 0
  },

  // ==========================
  // PORTFÓLIO
  // ==========================

  portfolio: [PortfolioSchema],

  // ==========================
  // HORÁRIOS
  // ==========================

  horarios: [HorarioSchema],

  diasAtendimento: [{
    type: String
  }],

  // ==========================
  // ESTATÍSTICAS
  // ==========================

  servicosConcluidos: {
    type: Number,
    default: 0
  },

  tempoResposta: {
    type: Number,
    default: 0
  },

  visualizacoes: {
    type: Number,
    default: 0
  },

  favoritos: {
    type: Number,
    default: 0
  },

  // ==========================
  // SELOS
  // ==========================

  verificado: {
    type: Boolean,
    default: false
  },

  premium: {
    type: Boolean,
    default: false
  },

  // ==========================
  // REDES SOCIAIS
  // ==========================

  instagram: String,

  facebook: String,

  site: String,

  // ==========================
  // CERTIFICADOS
  // ==========================

  certificados: [CertificadoSchema],

  // ==========================
  // GEOLOCALIZAÇÃO
  // ==========================

  latitude: Number,

  longitude: Number,

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },

  // ==========================
  // STATUS
  // ==========================

  isOnline: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// ==========================
// ÍNDICES
// ==========================

UserSchema.index({ role: 1 });

UserSchema.index({ servico: 1 });

UserSchema.index({ city: 1 });

UserSchema.index({ state: 1 });

UserSchema.index({ avaliacaoMedia: -1 });

UserSchema.index({ servicosConcluidos: -1 });

UserSchema.index({ latitude: 1, longitude: 1 });

UserSchema.index({ location: '2dsphere' });

// ==========================
// SENHA
// ==========================

UserSchema.methods.setPassword = async function(password){
  this.passwordHash = await bcrypt.hash(password,10);
};

UserSchema.methods.validatePassword = async function(password){
  return bcrypt.compare(password,this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);