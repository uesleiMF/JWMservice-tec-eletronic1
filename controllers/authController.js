const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  const { name, email, password, phone, role, servico, latitude, longitude } = req.body;

  if (!name || !email || !password || !phone || !role) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,        // ← Aqui estava o erro principal
      phone,
      role,
      servico: role === 'profissional' ? servico : undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      // Opcional: preencher location também
      location: latitude && longitude ? {
        type: 'Point',
        coordinates: [longitude, latitude]   // [lng, lat]
      } : undefined
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        servico: user.servico,
      }
    });
  } catch (err) {
    console.error('❌ ERRO NO REGISTRO:', err);
    res.status(500).json({ 
      message: 'Erro no registro', 
      error: err.message 
    });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha inválida' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        servico: user.servico,
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};