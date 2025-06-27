const express = require('express');
const router = express.Router();
const LocationLog = require('../models/LocationLog');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:userId', protect, async (req, res) => {
  try {
    const logs = await LocationLog.find({ user: req.params.userId }).sort({ createdAt: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
