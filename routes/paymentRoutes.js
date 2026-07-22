const express = require('express');
const router = express.Router();
const mercadopago = require('../config/mercadopago');
const User = require('../models/User');

// ==================== CRIAR PIX ====================
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

    if (user.paymentStatus === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Este usuário já possui pagamento confirmado.'
      });
    }

    const paymentData = {
      transaction_amount: Number(amount),
      description,
      payment_method_id: 'pix',
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payer: {
        email: user.email || 'cliente@teste.com',
        first_name: user.name?.split(' ')[0] || 'Cliente',
        last_name: user.name?.split(' ').slice(1).join(' ') || ''
      },
      external_reference: user._id.toString(),
      metadata: { userId: user._id.toString() }
    };

    console.log('Criando PIX para:', user.email);

    const response = await mercadopago.payment.create(paymentData);
    const payment = response.body;

    const pixData = payment.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      return res.status(500).json({
        success: false,
        message: 'Mercado Pago não retornou QR Code PIX.'
      });
    }

    // Atualiza usuário
    user.paymentId = payment.id;
    user.paymentStatus = 'pendente';
    await user.save();

    res.json({
      success: true,
      paymentId: payment.id,
      pix: {
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        expiration_date: payment.date_of_expiration
      }
    });

  } catch (error) {
    console.error('Erro ao criar PIX:', error.response?.body || error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar PIX',
      error: error.response?.body || error.message
    });
  }
});

// ==================== VERIFICAR STATUS ====================
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const response = await mercadopago.payment.get(paymentId);
    const payment = response.body;

    res.json({
      success: true,
      status: payment.status,
      detail: payment.status_detail,
      payment
    });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar status do pagamento'
    });
  }
});

module.exports = router;