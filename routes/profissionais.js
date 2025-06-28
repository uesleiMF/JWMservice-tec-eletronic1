const express = require('express');
const router = express.Router();

// Exemplo mockado
router.get('/', (req, res) => {
  const profissionais = [
    { nome: 'João Eletricista', servico: 'Eletricista', latitude: -23.55, longitude: -46.63 },
    { nome: 'Maria Encanadora', servico: 'Encanadora', latitude: -23.56, longitude: -46.62 },
  ];

  res.json(profissionais);
});

module.exports = router;
