const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // Participantes da conversa
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // Pedido relacionado (opcional)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    // Última mensagem enviada
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Data da última mensagem
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    // Status da conversa
    status: {
      type: String,
      enum: ['active', 'closed', 'archived', 'blocked'],
      default: 'active',
    },

    // Quantidade de mensagens não lidas por usuário
    unreadCount: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },

    // Usuários que ocultaram/excluíram a conversa
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Bloqueio da conversa
    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Informações adicionais
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      source: {
        type: String,
        enum: ['manual', 'order', 'system'],
        default: 'manual',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ==================== ÍNDICES ====================

// Buscar conversas de um usuário
ConversationSchema.index({ participants: 1 });

// Conversas relacionadas a pedidos
ConversationSchema.index({ orderId: 1 });

// Ordenação das conversas
ConversationSchema.index({ lastMessageAt: -1 });

// Status
ConversationSchema.index({ status: 1 });

// Busca otimizada para dashboard
ConversationSchema.index({
  participants: 1,
  lastMessageAt: -1,
});

// ==================== MÉTODOS ====================

// Incrementa mensagens não lidas
ConversationSchema.methods.incrementUnread = function (userId) {
  const current = this.unreadCount.get(String(userId)) || 0;
  this.unreadCount.set(String(userId), current + 1);
};

// Limpa contador de mensagens não lidas
ConversationSchema.methods.clearUnread = function (userId) {
  this.unreadCount.set(String(userId), 0);
};

// Oculta conversa para um usuário
ConversationSchema.methods.hideForUser = function (userId) {
  if (!this.deletedFor.some(id => id.toString() === userId.toString())) {
    this.deletedFor.push(userId);
  }
};

// Bloqueia conversa
ConversationSchema.methods.blockConversation = function (userId) {
  this.isBlocked = true;
  this.blockedBy = userId;
  this.status = 'blocked';
};

// Desbloqueia conversa
ConversationSchema.methods.unblockConversation = function () {
  this.isBlocked = false;
  this.blockedBy = null;
  this.status = 'active';
};

// ==================== EXPORT ====================

module.exports = mongoose.model('Conversation', ConversationSchema);