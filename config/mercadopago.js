const mercadopago = require('mercadopago');

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN não encontrado.');
}

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

console.log('✅ Mercado Pago configurado com sucesso');

module.exports = mercadopago;