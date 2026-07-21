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

    const response = await mercadopago.payment.create({
      transaction_amount: Number(amount),
      description,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.name
      },
      external_reference: user._id.toString()
    });

    const payment = response.body;

    res.json({
      success: true,
      payment,
      pix: {
        qr_code:
          payment.point_of_interaction.transaction_data.qr_code,
        qr_code_base64:
          payment.point_of_interaction.transaction_data.qr_code_base64,
        expiration_date: payment.date_of_expiration
      }
    });

  } catch (err) {

    console.error('Erro Mercado Pago');

    console.error(err.response?.body || err.message);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

module.exports = router;