const express = require('express');
const auth = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

// Criar pedido de serviço (cliente)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Acesso negado' });

    const { professionalId, description } = req.body;
    const serviceRequest = new ServiceRequest({
      client: req.user.id,
      professional: professionalId,
      description,
    });
    await serviceRequest.save();

    res.json(serviceRequest);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Listar pedidos do usuário (cliente ou profissional)
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'client' 
      ? { client: req.user.id } 
      : { professional: req.user.id };

    const requests = await ServiceRequest.find(filter)
      .populate('client', 'name email')
      .populate('professional', 'services address');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar status do pedido (profissional)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional') return res.status(403).json({ message: 'Acesso negado' });

    const { status } = req.body;
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) return res.status(404).json({ message: 'Pedido não encontrado' });
    if (serviceRequest.professional.toString() !== req.user.id) return res.status(403).json({ message: 'Acesso negado' });

    serviceRequest.status = status;
    await serviceRequest.save();

    res.json(serviceRequest);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
