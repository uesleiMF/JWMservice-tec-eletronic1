const express = require('express');
const auth = require('../middleware/auth');
const ProfessionalProfile = require('../models/ProfessionalProfile');

const router = express.Router();

// Criar/atualizar perfil do profissional
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional') return res.status(403).json({ message: 'Acesso negado' });

    const { services, description, price, address, location } = req.body;

    let profile = await ProfessionalProfile.findOne({ user: req.user.id });
    if (profile) {
      profile.services = services;
      profile.description = description;
      profile.price = price;
      profile.address = address;
      profile.location = location;
      await profile.save();
    } else {
      profile = new ProfessionalProfile({
        user: req.user.id,
        services,
        description,
        price,
        address,
        location,
      });
      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Listar todos profissionais
router.get('/', async (req, res) => {
  try {
    const professionals = await ProfessionalProfile.find().populate('user', 'name email');
    res.json(professionals);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Buscar profissionais próximos
// Exemplo: /api/professionals/near?lng=-46.633309&lat=-23.55052&maxDistance=5000
router.get('/near', async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng || !lat) return res.status(400).json({ message: 'Longitude e latitude são obrigatórios' });

    const professionals = await ProfessionalProfile.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        }
      }
    }).populate('user', 'name email');

    res.json(professionals);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
