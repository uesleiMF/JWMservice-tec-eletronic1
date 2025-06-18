// backend/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Cadastro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['client', 'professional'].includes(role)) {
      return res.status(400).json({ message: 'Role inválido' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email já cadastrado' });

    user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ou senha inválidos' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Email ou senha inválidos' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
