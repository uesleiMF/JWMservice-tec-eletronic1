const User = require('../models/User');

// ======================================================
// BUSCAR PROFISSIONAL POR ID
// ======================================================

exports.findById = async (req, res) => {
  try {
    const professional = await User.findOne({
      _id: req.params.id,
      role: 'profissional'
    }).select('-passwordHash -__v');

    if (!professional) {
      return res.status(404).json({
        error: 'Profissional não encontrado'
      });
    }

    res.json(professional);

  } catch (err) {
    console.error('Erro ao buscar profissional:', err);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ======================================================
// BUSCAR PROFISSIONAIS PRÓXIMOS
// ======================================================

exports.findNearby = async (req, res) => {
  try {
    const { latitude, longitude, distance = 10000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude e longitude são obrigatórias'
      });
    }

    const professionals = await User.find({
      role: 'profissional',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              parseFloat(longitude),
              parseFloat(latitude)
            ]
          },
          $maxDistance: parseInt(distance)
        }
      }
    })
    .select(`
      name
      foto
      servico
      especialidade
      avaliacaoMedia
      totalAvaliacoes
      location
      city
      state
      precoInicial
      verificado
      premium
    `)
    .limit(20);

    res.json(professionals);

  } catch (err) {
    console.error('Erro ao buscar profissionais próximos:', err);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ======================================================
// ATUALIZAR PERFIL PROFISSIONAL
// ======================================================

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // segurança
    if (
      req.user._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        error: 'Sem permissão para atualizar este perfil'
      });
    }

    // whitelist (SEGURANÇA IMPORTANTE)
    const updateData = {
      name: req.body.name,
      phone: req.body.phone,
      servico: req.body.servico,
      especialidade: req.body.especialidade,
      especialidades: req.body.especialidades,
      descricao: req.body.descricao,
      experiencia: req.body.experiencia,
      city: req.body.city,
      state: req.body.state,
      precoInicial: req.body.precoInicial,
      raioAtendimento: req.body.raioAtendimento,
      horarios: req.body.horarios,
      diasAtendimento: req.body.diasAtendimento,
      instagram: req.body.instagram,
      facebook: req.body.facebook,
      site: req.body.site,
      location: req.body.latitude && req.body.longitude
        ? {
            type: 'Point',
            coordinates: [
              parseFloat(req.body.longitude),
              parseFloat(req.body.latitude)
            ]
          }
        : undefined
    };

    const updated = await User.findOneAndUpdate(
      {
        _id: userId,
        role: 'profissional'
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash -__v');

    if (!updated) {
      return res.status(404).json({
        error: 'Profissional não encontrado'
      });
    }

    res.json(updated);

  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: err.message
      });
    }

    res.status(500).json({
      error: 'Erro ao atualizar perfil'
    });
  }
};