const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Função auxiliar para gerar token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      servico,
      especialidade,
      descricao,
      experiencia,
      city,
      state,
      precoInicial,
      latitude,
      longitude
    } = req.body;

    // Validação básica
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: 'Nome, email, senha, telefone e role são obrigatórios.'
      });
    }

    if (!['cliente', 'profissional'].includes(role)) {
      return res.status(400).json({ message: 'Role inválido.' });
    }

    // Verifica se email já existe
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // Prepara os dados
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role,
      servico: role === 'profissional' ? servico : undefined,
      especialidade: role === 'profissional' ? especialidade : undefined,
      descricao: role === 'profissional' ? descricao : undefined,
      experiencia: role === 'profissional' ? Number(experiencia || 0) : undefined,
      city,
      state,
      precoInicial: Number(precoInicial || 0),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    };

    // Geolocalização (importante para 2dsphere)
    if (latitude && longitude) {
      userData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)] // [lng, lat]
      };
    }

    const user = new User(userData);

    // Define a senha (hash)
    await user.setPassword(password);

    // Salva no banco
    await user.save();

    // Gera token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        servico: user.servico,
        city: user.city,
        state: user.state,
        latitude: user.latitude,
        longitude: user.longitude,
        avaliacaoMedia: user.avaliacaoMedia,
        verificado: user.verificado,
        premium: user.premium
      }
    });

  } catch (err) {
    console.error('ERRO REGISTER:', err);
    res.status(500).json({
      message: 'Erro ao cadastrar usuário.',
      error: err.message
    });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Informe email e senha.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha inválida.' });
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
        city: user.city,
        state: user.state,
        latitude: user.latitude,
        longitude: user.longitude,
        avaliacaoMedia: user.avaliacaoMedia,
        verificado: user.verificado,
        premium: user.premium,
        isOnline: user.isOnline
      }
    });

  } catch (err) {
    console.error('ERRO LOGIN:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { register: exports.register, login: exports.login };