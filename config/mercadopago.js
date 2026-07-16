const mercadopago = require('mercadopago');

const configureMercadoPago = () => {
    if (!process.env.MP_ACCESS_TOKEN) {
        console.error('❌ MP_ACCESS_TOKEN não encontrado no .env');
        return null;
    }

    mercadopago.configure({
        access_token: process.env.MP_ACCESS_TOKEN,
        // sandbox: process.env.NODE_ENV !== 'production'  // Ative em desenvolvimento se quiser
    });

    console.log('✅ Mercado Pago configurado com sucesso');
    return mercadopago;
};

const mp = configureMercadoPago();

module.exports = mp;
module.exports.mercadopago = mercadopago; // para usar diretamente se precisar