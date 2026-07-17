const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const mercadopago = require('../config/mercadopago');

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      servico,
      latitude,
      longitude
    } = req.body;

    console.log('📥 [REGISTER] Dados recebidos:', { role, email, name: name?.substring(0, 20) });

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

    const userData = {
      name,
      email,
      role,
      phone: phone || null,
      servico: role === 'profissional' ? servico : null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      status: role === 'profissional' ? 'pendente' : 'ativo',
      paymentStatus: role === 'profissional' ? 'não_pago' : 'não_pago'
    };

    if (latitude && longitude) {
      userData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      };
    }

    const user = new User(userData);
    await user.setPassword(password);
    await user.save();

    console.log('👤 Usuário salvo com sucesso. Role:', role);

    // ================= PAGAMENTO PARA PROFISSIONAL =================
    let paymentLink = null;
    if (role === 'profissional') {
      console.log('🎯 Iniciando criação de preference MP para:', email);

      try {
        const preference = {
          items: [{
            title: 'Cadastro de Profissional - JW Service',
            unit_price: 14.99,
            quantity: 1,
            currency_id: 'BRL'
          }],
          payer: { email: email },
          external_reference: user._id.toString(),
          back_urls: {
            success: `${process.env.FRONTEND_URL}/profissional/sucesso-pagamento`,
            failure: `${process.env.FRONTEND_URL}/profissional/falha-pagamento`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.BACKEND_URL}/api/webhook/mp`,
        };

        console.log('📤 Chamando mercadopago.preferences.create...');
        const response = await mercadopago.preferences.create(preference);

        console.log('✅ Preference criada com sucesso!');
        console.log('🔗 Link:', response.body.init_point);

        user.paymentPreferenceId = response.body.id;
        await user.save();

        paymentLink = response.body.init_point;

      } catch (mpError) {
        console.error('❌ ERRO Mercado Pago:');
        console.error(mpError.response?.data || mpError.message || mpError);
        // Continua mesmo com erro no pagamento
      }
    }

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
        status: user.status,
        paymentStatus: user.paymentStatus
      },
      paymentLink,
      message: role === 'profissional'
        ? 'Cadastro realizado! Complete o pagamento para ativar sua conta.'
        : 'Cadastro realizado com sucesso!'
    });

  } catch (err) {
    console.error('ERRO REGISTER GERAL:', err);
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

    if (user.role === 'profissional' && user.paymentStatus !== 'pago') {
      return res.status(403).json({
        message: 'Sua conta está pendente de pagamento. Complete o pagamento para acessar.'
      });
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
        status: user.status
      }
    });
  } catch (err) {
    console.error('ERRO LOGIN:', err);
    res.status(500).json({ message: 'Erro no login' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;