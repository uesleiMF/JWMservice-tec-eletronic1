const paypalClient = require('../config/paypal');
const Professional = require('../models/Professional');

exports.createOrder = async (req, res) => {
  try {
    const { professionalId, amount, plan } = req.body;

    if (!professionalId || !amount) {
      return res.status(400).json({ error: 'professionalId e amount são obrigatórios' });
    }

    if (amount < 1.99) {
      return res.status(400).json({ error: 'Valor mínimo é R$ 1,99' });
    }

    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });

    if (professional.paid) {
      return res.status(400).json({ error: 'Este profissional já está pago' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'BRL',
          value: amount.toFixed(2)
        },
        description: `Inscrição ${plan || 'Profissional'} - ${professional.name}`,
        reference_id: professionalId,
      }]
    });

    const order = await paypalClient.execute(request);

    res.status(200).json({ 
      id: order.result.id,
      amount: amount.toFixed(2),
      currency: 'BRL'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { professionalId } = req.body;
    const { orderId } = req.params;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      await Professional.findByIdAndUpdate(professionalId, {
        paid: true,
        paymentDate: new Date(),
        paypalOrderId: orderId,
        plan: capture.result.purchase_units[0]?.description || 'Padrão',
        paymentAmount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value)
      });
    }

    res.json({ success: true, capture: capture.result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
};