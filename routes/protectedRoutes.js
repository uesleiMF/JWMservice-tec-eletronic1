const express = require('express');
const router = express.Router();
const requirePayment = require('../middleware/requirePayment');

router.post('/protected-action', requirePayment, (req, res) => {
  res.json({ message: 'Ação executada com sucesso, acesso autorizado.' });
});

module.exports = router;
