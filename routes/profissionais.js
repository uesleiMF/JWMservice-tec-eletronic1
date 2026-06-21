const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==================== ROTAS PÚBLICAS ====================

// Buscar TODOS os profissionais
router.get('/', async (req, res) => {
  try {
    const profs = await User.find({ role: 'profissional' })
     .select('name email servico especialidade phone descricao experiencia avaliacao foto latitude longitude city state online');   res.json(profs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

// Buscar profissionais PRÓXIMOS
router.get('/proximos', async (req, res) => {
  try {
    const { latitude, longitude, raio = 50 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const profissionais = await User.find({
      role: 'profissional',
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).select('name email servico especialidade phone descricao experiencia avaliacao foto latitude longitude city state online');

    const profissionaisComDistancia = profissionais.map(p => {
      const distancia = calcularDistancia(lat, lon, p.latitude, p.longitude);
      return { ...p.toObject(), distance: distancia };
    });

    profissionaisComDistancia.sort((a, b) => a.distance - b.distance);
    res.json(profissionaisComDistancia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais próximos' });
  }
});

// Buscar um profissional por ID (para Perfil Público)
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

// ==================== ROTAS DO PERFIL (Temporário - sem autenticação) ====================

// Buscar MEU perfil
router.get('/meu', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório na query (?userId=xxx)' });
    }

    const user = await User.findById(userId)
      .select('name email phone servico especialidade descricao experiencia foto city state latitude longitude online');

    if (!user) {
      return res.status(404).json({ message: 'Perfil não encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// Atualizar MEU perfil
router.put('/meu', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório na query' });
    }

    const { name, phone, servico, especialidade, descricao, experiencia, city, state, foto } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, servico, especialidade, descricao, experiencia, city, state, foto },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ 
      message: 'Perfil atualizado com sucesso!', 
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// ==================== FUNÇÃO AUXILIAR ====================
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;