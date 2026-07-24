const express = require('express');
const router = express.Router();

const mercadopago = require('../config/mercadopago');
const User = require('../models/User');

// ======================================================
// WEBHOOK MERCADO PAGO
// URL FINAL:
// https://SEU_BACKEND/api/webhook/mp
// ======================================================
router.post('/', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('==============================');
    console.log('📨 WEBHOOK RECEBIDO');
    console.log(req.body);
    console.log('==============================');

    if (type !== 'payment' || !data?.id) {
      console.log('Webhook ignorado.');
      return res.sendStatus(200);
    }

    const paymentId = data.id;

    const response = await mercadopago.payment.get(paymentId);
    const payment = response.body;

    console.log('Pagamento encontrado:');
    console.log({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference
    });

    const profissionalId = payment.external_reference;

    if (!profissionalId) {
      console.warn('❌ external_reference não encontrada.');
      return res.sendStatus(200);
    }

    if (payment.status === 'approved') {

      const user = await User.findById(profissionalId);

      if (!user) {
        console.warn(`❌ Usuário não encontrado: ${profissionalId}`);
        return res.sendStatus(200);
      }

      user.status = 'ativo';
      user.paymentStatus = 'pago';
      user.verificado = true;
      user.registrationFeePaidAt = new Date();
      user.paymentId = payment.id;

      await user.save();

      console.log('===================================');
      console.log('✅ PROFISSIONAL ATIVADO');
      console.log('Nome:', user.name);
      console.log('Status:', user.status);
      console.log('Pagamento:', user.paymentStatus);
      console.log('===================================');
    } else {

      console.log(
        `Pagamento ${payment.id} ainda está: ${payment.status}`
      );

    }

    return res.sendStatus(200);

  } catch (error) {

    console.error('==============================');
    console.error('ERRO WEBHOOK MP');
    console.error(error.response?.body || error.message);
    console.error('==============================');

    return res.sendStatus(200);
  }
});

module.exports = router;