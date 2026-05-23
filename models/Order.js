const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profissional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  servico: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'finalizado', 'cancelado'],
    default: 'pendente'
  },
  valor: {
    type: Number,
    min: 0
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  dataFinalizacao: {
    type: Date
  }
}, {
  timestamps: true, // Cria automaticamente updatedAt
});

// Índices para melhorar performance
OrderSchema.index({ cliente: 1, status: 1 });
OrderSchema.index({ profissional: 1, status: 1 });
OrderSchema.index({ criadoEm: -1 });

// Middleware antes de salvar
OrderSchema.pre('save', function (next) {
  if (this.status === 'finalizado' && !this.dataFinalizacao) {
    this.dataFinalizacao = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);