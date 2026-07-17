// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { Payment } = require('mercadopago');
const mpClient = require('../config/mercadopago');
const User = require('../models/User');

// ==================== CRIAR PAGAMENTO PIX ====================
router.post('/create-pix', async (req, res) => {
  try {
    const { userId, amount = 49.90, description = 'Taxa de cadastro profissional' } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
    }

    const paymentService = new Payment(mpClient);

    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description,
      payment_method_id: 'pix',
      external_reference: userId.toString(),   // Importante para o webhook
      payer: {
        email: req.body.email || 'cliente@email.com',
        first_name: req.body.name || 'Profissional',
      },
    };

    const payment = await paymentService.create(paymentData);

    res.json({
      success: true,
      payment,
      pix: {
        qr_code: payment.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
        expiration_date: payment.date_of_expiration
      }
    });

  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar pagamento PIX'
    });
  }
});

module.exports = router;