const mercadopago = require('mercadopago');

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN não encontrado no .env');
}

// Configuração explícita
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
  // Opcional: forçar sandbox
  // sandbox: true   // descomente se necessário
});

console.log('✅ Mercado Pago configurado com sucesso');
console.log('🔑 Usando Access Token:', process.env.MP_ACCESS_TOKEN?.substring(0, 20) + '...');

module.exports = mercadopago;