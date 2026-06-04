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

  // Validação
  if (!name || !email || !password || !role || !phone) {
    return res.status(400).json({ 
      message: 'Nome, email, senha, telefone e role são obrigatórios' 
    });
  }

  if (role === 'profissional' && !servico) {
    return res.status(400).json({ 
      message: 'Profissionais devem informar o serviço oferecido' 
    });
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
      password: hashedPassword,
      phone,
      role,
      servico: role === 'profissional' ? servico : undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
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
      },
    });
  } catch (err) {
    console.error('Erro no registro:', err); // ← Isso vai aparecer no log do Render
    res.status(500).json({ 
      message: 'Erro no registro', 
      error: err.message // ← Temporário para debug
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

    const isMatch = await bcrypt.compare(password, user.password);
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
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};