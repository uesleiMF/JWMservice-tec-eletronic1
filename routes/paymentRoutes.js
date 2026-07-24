const express = require('express');
const router = express.Router();

const mercadopago = require('../config/mercadopago');
const User = require('../models/User');

// ======================================================
// CRIAR PIX
// ======================================================
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

    if (
      user.paymentStatus === 'pago' ||
      user.status === 'ativo'
    ) {

      return res.status(400).json({
        success: false,
        message: 'Este profissional já está ativo.'
      });

    }

    const paymentData = {

      transaction_amount: Number(amount),

      description,

      payment_method_id: 'pix',

      date_of_expiration:
        new Date(
          Date.now() + (30 * 60 * 1000)
        ).toISOString(),

      payer: {

        email: user.email,

        first_name:
          user.name?.split(' ')[0] || 'Cliente',

        last_name:
          user.name?.split(' ').slice(1).join(' ') || ''

      },

      external_reference: user._id.toString(),

      metadata: {

        userId: user._id.toString()

      }

    };

    console.log('======================');
    console.log('CRIANDO PIX');
    console.log(user.email);
    console.log('======================');

    const response =
      await mercadopago.payment.create(paymentData);

    const payment = response.body;

    const pix =
      payment.point_of_interaction?.transaction_data;

    if (!pix?.qr_code) {

      return res.status(500).json({

        success: false,

        message:
          'QR Code PIX não retornado pelo Mercado Pago.'

      });

    }

    user.paymentId = payment.id;
    user.paymentStatus = 'pendente';

    await user.save();

    res.json({

      success: true,

      paymentId: payment.id,

      pix: {

        qr_code: pix.qr_code,

        qr_code_base64: pix.qr_code_base64,

        expiration_date:
          payment.date_of_expiration

      }

    });

  }

  catch (err) {

    console.error(
      err.response?.body || err.message
    );

    res.status(500).json({

      success: false,

      message: 'Erro ao criar PIX.'

    });

  }

});

// ======================================================
// CONSULTAR STATUS
// ======================================================
router.get('/status/:paymentId', async (req, res) => {

  try {

    const { paymentId } = req.params;

    const response =
      await mercadopago.payment.get(paymentId);

    const payment = response.body;

    console.log(
      `Pagamento ${payment.id}: ${payment.status}`
    );

    // ===========================================
    // SINCRONIZA COM O BANCO
    // ===========================================
    if (payment.status === 'approved') {

      const profissionalId =
        payment.external_reference;

      if (profissionalId) {

        const user =
          await User.findById(profissionalId);

        if (user) {

          if (
            user.paymentStatus !== 'pago'
          ) {

            user.paymentStatus = 'pago';
            user.status = 'ativo';
            user.verificado = true;
            user.paymentId = payment.id;
            user.registrationFeePaidAt =
              new Date();

            await user.save();

            console.log(
              `✅ ${user.name} ativado automaticamente`
            );

          }

        }

      }

    }

    res.json({

      success: true,

      status: payment.status,

      detail: payment.status_detail,

      payment

    });

  }

  catch (err) {

    console.error(err.response?.body || err.message);

    res.status(500).json({

      success: false,

      message:
        'Erro ao consultar pagamento.'

    });

  }

});

module.exports = router;