// models/Conversation.js

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },

  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },

  lastMessageAt: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },

  unreadCount: {
    type: Map,
    of: Number,
    default: () => new Map()
  }
}, {
  timestamps: true
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ orderId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ status: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);