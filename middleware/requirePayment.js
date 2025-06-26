const Professional = require('../models/Professional');

const requirePayment = async (req, res, next) => {
  const { professionalId } = req.body;
  const professional = await Professional.findById(professionalId);
  if (!professional || !professional.paid) {
    return res.status(403).json({ error: 'Aguardando pagamento para acessar este recurso.' });
  }
  next();
};

module.exports = requirePayment;
