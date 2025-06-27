const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  transactionId: String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  commission: Number,
  releasedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
