const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// LISTAR PROFISSIONAIS
// ======================================================

router.get('/', async (req, res) => {
  try {

    const profs = await User.find({ role: 'profissional' })
      .select(
        'name email servico especialidade phone descricao experiencia foto city state avaliacaoMedia totalAvaliacoes precoInicial verificado premium isOnline location'
      );

    res.json(profs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar profissionais' });
  }
});

// ======================================================
// PROFISSIONAIS PRÓXIMOS (SEGURADO + FALLBACK)
// ======================================================

router.get('/proximos', async (req, res) => {
  try {

    const { latitude, longitude, raio = 50000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude e longitude são obrigatórios'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    const profissionais = await User.find({
      role: 'profissional',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: parseInt(raio)
        }
      }
    })
    .select('name servico especialidade foto city state avaliacaoMedia totalAvaliacoes precoInicial verificado premium isOnline location')
    .limit(20);

    res.json(profissionais);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao buscar profissionais próximos'
    });
  }
});

// ======================================================
// PROFISSIONAL POR ID
// ======================================================

router.get('/:id', async (req, res) => {
  try {

    const profissional = await User.findOne({
      _id: req.params.id,
      role: 'profissional'
    }).select(
      'name email servico especialidade phone descricao experiencia foto city state avaliacaoMedia totalAvaliacoes precoInicial portfolio horarios diasAtendimento raioAtendimento verificado premium servicosConcluidos favoritos visualizacoes instagram facebook site location'
    );

    if (!profissional) {
      return res.status(404).json({
        message: 'Profissional não encontrado'
      });
    }

    res.json(profissional);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao buscar profissional'
    });
  }
});

// ======================================================
// MEU PERFIL (PROTEGIDO)
// ======================================================

router.get('/meu', protect, async (req, res) => {
  try {

    const userId = req.user._id;

    const user = await User.findOne({
      _id: userId,
      role: 'profissional'
    }).select(
      'name email phone servico especialidade descricao experiencia foto city state avaliacaoMedia totalAvaliacoes precoInicial portfolio horarios diasAtendimento latitude longitude'
    );

    if (!user) {
      return res.status(404).json({
        message: 'Perfil não encontrado'
      });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao buscar perfil'
    });
  }
});

// ======================================================
// ATUALIZAR MEU PERFIL (SEGURADO)
// ======================================================

router.put('/meu', protect, async (req, res) => {
  try {

    const userId = req.user._id;

    const allowedFields = {
      name: req.body.name,
      phone: req.body.phone,
      servico: req.body.servico,
      especialidade: req.body.especialidade,
      descricao: req.body.descricao,
      experiencia: req.body.experiencia,
      city: req.body.city,
      state: req.body.state,
      foto: req.body.foto,
      precoInicial: req.body.precoInicial,
      raioAtendimento: req.body.raioAtendimento,
      horarios: req.body.horarios,
      diasAtendimento: req.body.diasAtendimento,
      instagram: req.body.instagram,
      facebook: req.body.facebook,
      site: req.body.site
    };

    // geolocalização separada (seguro)
    if (req.body.latitude && req.body.longitude) {
      allowedFields.location = {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ]
      };
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        role: 'profissional'
      },
      { $set: allowedFields },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao atualizar perfil'
    });
  }
});

module.exports = router;