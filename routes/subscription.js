// routes/subscription.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/create', async (req, res) => {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'Access Token do Mercado Pago não definido' });
    }

    const BASE_URL = process.env.BASE_URL || 'https://acb1-186-249-211-99.ngrok-free.app';

    const preference = {
      items: [
        {
          title: 'Assinatura Mensal - Profissional',
          quantity: 1,
          unit_price: 49.90,
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: `${BASE_URL}/success`,
        failure: `${BASE_URL}/failure`,
        pending: `${BASE_URL}/pending`,
      },
      auto_return: 'approved',
    };

    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preference,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ init_point: response.data.init_point });
  } catch (error) {
    const errMsg = error.response?.data || error.message;
    console.error('Erro ao criar preferência:', errMsg);
    res.status(500).json({ error: 'Erro ao criar preferência', details: errMsg });
  }
});

module.exports = router;
