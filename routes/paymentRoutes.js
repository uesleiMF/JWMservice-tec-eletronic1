const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mercadopago = require('../config/mercadopago');

// ================= WEBHOOK MERCADO PAGO =================
router.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log('📨 Webhook recebido:', type, data);

        // Processa apenas notificações de pagamento
        if (type === 'payment' && data?.id) {
            const paymentId = data.id;

            // Busca os detalhes do pagamento
            const payment = await mercadopago.payment.findById(paymentId);

            if (payment && payment.body.status === 'approved') {
                const profissionalId = payment.body.external_reference;

                // Atualiza o usuário
                const user = await User.findByIdAndUpdate(
                    profissionalId,
                    {
                        status: 'ativo',
                        paymentStatus: 'pago',
                        registrationFeePaidAt: new Date(),
                        verificado: true // opcional: marca como verificado
                    },
                    { new: true }
                );

                if (user) {
                    console.log(`✅ Pagamento aprovado para profissional: ${user.name} (${user._id})`);
                    
                    // Aqui você pode emitir um evento via Socket.IO se quiser notificar o usuário em tempo real
                }
            }
        }

        // Sempre responde com 200 para o Mercado Pago não reenviar
        res.sendStatus(200);

    } catch (error) {
        console.error('Erro no webhook:', error);
        res.sendStatus(200); // Mesmo com erro, responder 200
    }
});

module.exports = router;