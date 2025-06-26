// backend/routes/webhook.js
router.post('/webhook', express.json(), async (req, res) => {
    const { type, data } = req.body;
  
    if (type === 'payment') {
      const payment = await mercadopago.payment.findById(data.id);
      if (payment.body.status === 'approved') {
        const userId = payment.body.external_reference;
        // Libere o acesso para o profissional no banco de dados
        // Ex: await Professional.updateOne({ user: userId }, { paymentConfirmed: true });
        console.log(`Pagamento aprovado para userId: ${userId}`);
      }
    }
  
    res.sendStatus(200);
  });
  