const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coords: {
    lat: Number,
    lng: Number
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LocationLog', locationLogSchema);
