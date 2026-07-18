const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const mercadopago = require('../config/mercadopago');

// ====================== GERAR TOKEN ======================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

// ====================== REGISTER ======================
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
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

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Nome, email, senha e perfil são obrigatórios.'
      });
    }

    if (!['cliente', 'profissional'].includes(role)) {
      return res.status(400).json({
        message: 'Perfil inválido.'
      });
    }

    const exists = await User.findOne({
      email: email.toLowerCase()
    });

    if (exists) {
      return res.status(400).json({
        message: 'Este e-mail já está cadastrado.'
      });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      phone,
      servico,
      especialidade,
      descricao,
      experiencia: Number(experiencia || 0),
      city,
      state,
      precoInicial: Number(precoInicial || 0),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,

      status: role === 'cliente' ? 'ativo' : 'pendente',
      paymentStatus: role === 'cliente' ? 'pago' : 'não_pago'
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

    let paymentLink = null;

    if (role === 'profissional') {
      try {

        const preference = {
          items: [
            {
              title: 'Cadastro Profissional JW Service',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: 14.99
            }
          ],

          payer: {
            email: user.email
          },

          external_reference: user._id.toString(),

          back_urls: {
            success: `${process.env.FRONTEND_URL}/profissional/sucesso-pagamento`,
            failure: `${process.env.FRONTEND_URL}/profissional/falha-pagamento`,
            pending: `${process.env.FRONTEND_URL}/profissional/pagamento-pendente`
          },

          auto_return: 'approved',

          notification_url:
            `${process.env.BACKEND_URL}/api/webhook/mp`
        };

        const response =
          await mercadopago.preferences.create(preference);

        paymentLink = response.body.init_point;

        user.paymentPreferenceId = response.body.id;

        await user.save();

      } catch (err) {

        console.error('Erro Mercado Pago');

        console.error(err.response?.data || err.message);

      }
    }

    const token = generateToken(user);

    res.status(201).json({

      token,

      paymentLink,

      user: {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        phone: user.phone,

        servico: user.servico,

        especialidade: user.especialidade,

        city: user.city,

        state: user.state,

        latitude: user.latitude,

        longitude: user.longitude,

        status: user.status,

        paymentStatus: user.paymentStatus,

        premium: user.premium,

        isOnline: user.isOnline,

        verificado: user.verificado
      },

      message:
        role === 'profissional'
          ? 'Cadastro realizado. Finalize o pagamento para ativar sua conta.'
          : 'Cadastro realizado com sucesso.'

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Erro ao cadastrar usuário.'
    });

  }

});

// ====================== LOGIN ======================
router.post('/login', async (req, res) => {

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

    const valid = await user.validatePassword(password);

    if (!valid) {
      return res.status(400).json({
        message: 'Senha inválida.'
      });
    }

    // Apenas contas bloqueadas não entram
    if (user.status === 'bloqueado') {
      return res.status(403).json({
        message:
          'Sua conta foi bloqueada. Entre em contato com o suporte.'
      });
    }

    user.isOnline = true;

    await user.save();

    const token = generateToken(user);

    res.json({

      token,

      user: {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        phone: user.phone,

        servico: user.servico,

        especialidade: user.especialidade,

        city: user.city,

        state: user.state,

        latitude: user.latitude,

        longitude: user.longitude,

        status: user.status,

        paymentStatus: user.paymentStatus,

        premium: user.premium,

        isOnline: user.isOnline,

        verificado: user.verificado

      }

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Erro interno do servidor.'
    });

  }

});

// ====================== USUÁRIO LOGADO ======================
router.get('/me', protect, async (req, res) => {

  res.json({
    user: req.user
  });

});

module.exports = router;