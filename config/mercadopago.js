const mercadopago = require('mercadopago');

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN não encontrado no .env');
}

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

console.log('✅ Mercado Pago configurado');
console.log(
  '🔑 Token:',
  process.env.MP_ACCESS_TOKEN.substring(0,20) + '...'
);

module.exports = mercadopago;