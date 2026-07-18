// routes/webhookMP.js
const express = require('express');
const router = express.Router();

const mercadopago = require('../config/mercadopago');
const User = require('../models/User');


// ================= WEBHOOK MERCADO PAGO =================
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('📨 Webhook Mercado Pago recebido:', {
      type,
      data
    });

    if (type === 'payment' && data?.id) {

      const paymentId = data.id;

      const response = await mercadopago.payment.get(paymentId);

      const payment = response.body;

      console.log(
        `🔍 Pagamento ${paymentId} - Status: ${payment.status}`
      );


      if (payment.status === 'approved') {

        const profissionalId = payment.external_reference;


        if (profissionalId) {

          const user = await User.findByIdAndUpdate(
            profissionalId,
            {
              status: 'ativo',
              paymentStatus: 'pago',
              registrationFeePaidAt: new Date(),
              verificado: true,
              paymentId: paymentId
            },
            {
              new: true
            }
          );


          if (user) {
            console.log(
              `✅ Profissional ativado: ${user.name}`
            );
          } else {
            console.warn(
              `⚠️ Usuário não encontrado: ${profissionalId}`
            );
          }

        }
      }

      if (
        payment.status === 'rejected' ||
        payment.status === 'cancelled'
      ) {
        console.log(
          `❌ Pagamento ${paymentId}: ${payment.status}`
        );
      }
    }


    res.sendStatus(200);


  } catch (error) {

    console.error(
      '❌ Erro webhook Mercado Pago:',
      error.response?.body || error.message
    );

    res.sendStatus(200);
  }
});


module.exports = router;