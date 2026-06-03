const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');   // ← alterado aqui

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, servico, latitude, longitude } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Nome, email, senha e role são obrigatórios' });
    }
    if (!['cliente', 'profissional'].includes(role)) {
      return res.status(400).json({ message: 'Role inválido' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const user = new User({
      name,
      email,
      role,
      phone: phone || null,
      servico: role === 'profissional' ? servico : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    await user.setPassword(password);
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        servico: user.servico,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no registro' });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        servico: user.servico,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login' });
  }
});

// ================= ME =================
router.get('/me', protect, (req, res) => {   // ← alterado aqui
  res.json({ user: req.user });
});

module.exports = router;