const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Buscar TODOS os profissionais
router.get('/', async (req, res) => {
  try {
    const profs = await User.find({ role: 'profissional' })
      .select('name email servico latitude longitude phone');
    res.json(profs);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

// Buscar profissionais PRÓXIMOS (nova rota)
router.get('/proximos', async (req, res) => {
  try {
    const { latitude, longitude, raio = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxDistance = parseFloat(raio) * 1000; // converter km para metros

    const profissionais = await User.find({
      role: 'profissional',
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).select('name email servico latitude longitude phone');

    // Calcula distância simples (fórmula de Haversine)
    const profissionaisComDistancia = profissionais.map(p => {
      const distancia = calcularDistancia(lat, lon, p.latitude, p.longitude);
      return { ...p.toObject(), distancia };
    });

    // Ordena do mais próximo para o mais distante
    profissionaisComDistancia.sort((a, b) => a.distancia - b.distancia);

    res.json(profissionaisComDistancia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais próximos' });
  }
});

// Função auxiliar para calcular distância em KM
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // distância em km
}

module.exports = router;