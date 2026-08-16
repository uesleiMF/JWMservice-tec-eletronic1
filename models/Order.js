const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // =========================
  // RELACIONAMENTOS
  // =========================
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profissional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },

  // =========================
  // DADOS DO SERVIÇO
  // =========================
  servico: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  descricao: {
    type: String,
    trim: true
  },
  valor: {
    type: Number,
    min: 0,
    default: 0
  },

  // =========================
  // LOCAL E AGENDAMENTO (NOVOS)
  // =========================
  endereco: {
    type: String,
    trim: true,
    default: ""
  },
  dataPreferencia: {
    type: Date,
    default: null
  },
  periodo: {
    type: String, // ex: "09:00", "Manhã", "Tarde", "14:30"
    trim: true,
    default: ""
  },

  // =========================
  // STATUS DO FLUXO
  // =========================
  status: {
    type: String,
    enum: [
      'pendente',
      'aceito',
      'em_andamento',
      'finalizado',
      'cancelado',
      'recusado'
    ],
    default: 'pendente',
    index: true
  },

  // =========================
  // CONTROLE
  // =========================
  dataFinalizacao: {
    type: Date,
    default: null
  },
  canceladoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  motivoCancelamento: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// =========================
// ÍNDICES
// =========================
OrderSchema.index({ cliente: 1, createdAt: -1 });
OrderSchema.index({ profissional: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);