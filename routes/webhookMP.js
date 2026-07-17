// routes/webhookMP.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Payment } = require('mercadopago');
const mpClient = require('../config/mercadopago');

// ================= WEBHOOK MERCADO PAGO =================
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('📨 Webhook Mercado Pago recebido:', type, data);

    // Processa apenas notificações de pagamento
    if (type === 'payment' && data?.id) {
      const paymentId = data.id;

      const paymentService = new Payment(mpClient);
      const payment = await paymentService.get({ id: paymentId });

      console.log('🔍 Status do pagamento:', payment.status);

      if (payment.status === 'approved') {
        const profissionalId = payment.external_reference;

        if (profissionalId) {
          const user = await User.findByIdAndUpdate(
            profissionalId,
            {
              status: 'ativo',
              paymentStatus: 'pago',
              registrationFeePaidAt: new Date(),
              verificado: true
            },
            { new: true }
          );

          if (user) {
            console.log(`✅ Pagamento aprovado para: ${user.name} (${user._id})`);
          } else {
            console.log(`⚠️ Usuário ${profissionalId} não encontrado`);
          }
        }
      }
    }

    // SEMPRE responder 200 o mais rápido possível
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook Mercado Pago:', error);
    res.sendStatus(200); // Nunca retornar erro para o Mercado Pago
  }
});

module.exports = router;