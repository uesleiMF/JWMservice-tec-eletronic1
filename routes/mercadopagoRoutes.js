const express = require('express');
const router = express.Router();
const mercadopago = require('../config/mercadopago');
const User = require('../models/User');

router.post('/create-pix', async (req, res) => {
  try {
    const {
      userId,
      amount = 1.00,
      description = 'Taxa de ativação profissional'
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // 🔧 Configuração completa para PIX funcionar no Sandbox
    const paymentData = {
      transaction_amount: Number(amount),
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: user.email || 'teste@email.com',
        first_name: user.name ? user.name.split(' ')[0] : 'Cliente',
        last_name: user.name ? user.name.split(' ').slice(1).join(' ') : 'Teste',
        identification: {
          type: 'CPF',
          number: '12345678909'   // CPF fictício válido para testes
        }
      },
      external_reference: `ativacao_${user._id}`,
      additional_info: {
        items: [
          {
            id: "ativacao-profissional",
            title: description,
            description: "Ativação de conta profissional - JWM Service",
            quantity: 1,
            unit_price: Number(amount)
          }
        ]
      }
    };

    const response = await mercadopago.payment.create(paymentData);
    const payment = response.body;

    const pixData = payment.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      return res.status(500).json({
        success: false,
        message: 'Não foi possível gerar o QR Code PIX'
      });
    }

    res.json({
      success: true,
      paymentId: payment.id,
      pix: {
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        expiration_date: payment.date_of_expiration
      }
    });

  } catch (err) {
    console.error('Erro Mercado Pago:', err.response?.body || err);
    res.status(500).json({
      success: false,
      message: err.response?.body?.message || 'Erro ao criar PIX'
    });
  }
});

module.exports = router;