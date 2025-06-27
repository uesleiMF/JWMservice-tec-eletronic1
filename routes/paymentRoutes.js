const express = require('express');
const router = express.Router();
const paypalClient = require('../config/paypal');
const ServiceRequest = require('../models/ServiceRequest');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-order', protect, async (req, res) => {
  const { amount } = req.body;
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2)
      }
    }]
  });

  try {
    const order = await paypalClient.execute(request);
    res.json(order.result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido PayPal' });
  }
});

router.post('/capture-order', protect, async (req, res) => {
  const { orderId, serviceId } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);

    // Vincular pagamento ao serviço
    const service = await ServiceRequest.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    service.paypalOrderId = orderId;
    service.paymentStatus = 'pago';
    await service.save();

    res.json(capture.result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao capturar pagamento' });
  }
});

module.exports = router;
