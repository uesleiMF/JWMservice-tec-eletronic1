const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    // Conversa
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    // Pedido relacionado (opcional)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    // Remetente
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Destinatário
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Tipo da mensagem
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'file',
        'audio',
        'location',
        'system'
      ],
      default: 'text',
    },

    // Texto
    text: {
      type: String,
      trim: true,
      default: '',
    },

    // Anexo
    attachment: {
      url: {
        type: String,
        default: null,
      },

      fileName: {
        type: String,
        default: null,
      },

      fileType: {
        type: String,
        default: null,
      },

      fileSize: {
        type: Number,
        default: 0,
      },
    },

    // Localização
    location: {
      latitude: Number,
      longitude: Number,
    },

    // Mensagem lida
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Mensagem entregue
    delivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    // Editada
    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // Excluída
    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// ================= ÍNDICES =================

MessageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

MessageSchema.index({
  senderId: 1,
});

MessageSchema.index({
  receiverId: 1,
});

MessageSchema.index({
  orderId: 1,
});

// ================= MÉTODOS =================

MessageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
};

MessageSchema.methods.markAsDelivered = function () {
  this.delivered = true;
  this.deliveredAt = new Date();
};

MessageSchema.methods.editMessage = function (newText) {
  this.text = newText;
  this.edited = true;
  this.editedAt = new Date();
};

MessageSchema.methods.deleteMessage = function () {
  this.deleted = true;
  this.deletedAt = new Date();
};

module.exports = mongoose.model('Message', MessageSchema);