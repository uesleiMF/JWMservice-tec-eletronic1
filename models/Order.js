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

  // NOVO CAMPO
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
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
    enum: [
      'pendente',
      'aceito',
      'em_andamento',
      'finalizado',
      'cancelado',
      'recusado'
    ],
    default: 'pendente'
  },

  valor: {
    type: Number,
    min: 0
  },

  dataFinalizacao: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);