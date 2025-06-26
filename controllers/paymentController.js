const paypalClient = require('../config/paypal');
const Professional = require('../models/Professional');
const paypal = require('@paypal/checkout-server-sdk');

exports.createOrder = async (req, res) => {
  const { professionalId } = req.body;
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: { currency_code: 'USD', value: '10.00' },
      description: `Inscrição profissional - ID ${professionalId}`
    }]
  });

  try {
    const order = await paypalClient.execute(request);
    res.status(200).json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.captureOrder = async (req, res) => {
  const { professionalId } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(req.params.orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    if (capture.result.status === 'COMPLETED') {
      await Professional.findByIdAndUpdate(professionalId, { paid: true });
    }
    res.json(capture.result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
