const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ====================== GERAR TOKEN ======================
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

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: 'Nome, email, senha, telefone e perfil são obrigatórios.'
      });
    }

    if (!['cliente', 'profissional'].includes(role)) {
      return res.status(400).json({
        message: 'Tipo de usuário inválido.'
      });
    }

    const emailExists = await User.findOne({
      email: email.toLowerCase()
    });

    if (emailExists) {
      return res.status(400).json({
        message: 'Este e-mail já está cadastrado.'
      });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      role,
      servico: role === 'profissional' ? servico : undefined,
      especialidade: role === 'profissional' ? especialidade : undefined,
      descricao: role === 'profissional' ? descricao : undefined,
      experiencia: role === 'profissional'
        ? Number(experiencia || 0)
        : undefined,
      city,
      state,
      precoInicial: Number(precoInicial || 0),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined
    });

    if (latitude && longitude) {
      user.location = {
        type: 'Point',
        coordinates: [
          Number(longitude),
          Number(latitude)
        ]
      };
    }

    await user.setPassword(password);

    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        servico: user.servico,
        especialidade: user.especialidade,
        city: user.city,
        state: user.state,
        latitude: user.latitude,
        longitude: user.longitude,
        avaliacaoMedia: user.avaliacaoMedia,
        verificado: user.verificado,
        premium: user.premium,
        paymentStatus: user.paymentStatus,
        status: user.status,
        isOnline: user.isOnline
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
      return res.status(400).json({
        message: 'Informe email e senha.'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(400).json({
        message: 'Usuário não encontrado.'
      });
    }

    const validPassword = await user.validatePassword(password);

    if (!validPassword) {
      return res.status(400).json({
        message: 'Senha inválida.'
      });
    }

    // Bloqueia somente profissionais bloqueados
    if (
      user.role === 'profissional' &&
      user.status === 'bloqueado'
    ) {
      return res.status(403).json({
        message:
          'Sua conta está bloqueada. Entre em contato com o suporte.'
      });
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        servico: user.servico,
        especialidade: user.especialidade,
        city: user.city,
        state: user.state,
        latitude: user.latitude,
        longitude: user.longitude,
        avaliacaoMedia: user.avaliacaoMedia,
        verificado: user.verificado,
        premium: user.premium,
        paymentStatus: user.paymentStatus,
        status: user.status,
        isOnline: true
      }
    });

  } catch (err) {
    console.error('ERRO LOGIN:', err);

    res.status(500).json({
      message: 'Erro interno do servidor.'
    });
  }
};

// ====================== LOGOUT ======================
exports.logout = async (req, res) => {
  try {

    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        isOnline: false
      });
    }

    res.json({
      message: 'Logout realizado com sucesso.'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Erro ao realizar logout.'
    });
  }
};

module.exports = {
  register: exports.register,
  login: exports.login,
  logout: exports.logout
};