const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==================== BUSCAR TODOS OS PROFISSIONAIS ====================
router.get('/', async (req, res) => {
  try {
    const profs = await User.find({ role: 'profissional' })
      .select('name email servico especialidade phone descricao experiencia avaliacao foto latitude longitude city state');
    res.json(profs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

// ==================== BUSCAR PROFISSIONAIS PRÓXIMOS ====================
router.get('/proximos', async (req, res) => {
  try {
    const { latitude, longitude, raio = 50 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxDistance = parseFloat(raio) * 1000;

    const profissionais = await User.find({
      role: 'profissional',
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).select('name email servico especialidade phone descricao experiencia avaliacao foto latitude longitude city state');

    const profissionaisComDistancia = profissionais.map(p => {
      const distancia = calcularDistancia(lat, lon, p.latitude, p.longitude);
      return { ...p.toObject(), distancia };
    });

    profissionaisComDistancia.sort((a, b) => a.distancia - b.distancia);

    res.json(profissionaisComDistancia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais próximos' });
  }
});

// ==================== BUSCAR UM PROFISSIONAL POR ID (IMPORTANTE PARA PERFIL) ====================
router.get('/:id', async (req, res) => {
  try {
    const profissional = await User.findOne({ 
      _id: req.params.id, 
      role: 'profissional' 
    }).select('name email servico especialidade phone descricao experiencia avaliacao foto latitude longitude city state online');

    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }

    res.json(profissional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissional' });
  }
});

// Função auxiliar para calcular distância
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;