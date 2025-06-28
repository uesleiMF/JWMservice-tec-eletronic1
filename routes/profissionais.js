const express = require('express');
const router = express.Router();
const User = require('../models/User'); // modelo do usuário

// GET /api/profissionais — lista todos os profissionais
router.get('/', async (req, res) => {
  try {
    const profissionais = await User.find({ role: 'profissional' }).select('name email');
    res.json(profissionais);
  } catch (err) {
    console.error('Erro ao buscar profissionais:', err);
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

module.exports = router;
