const User = require('../models/User');

// ======================================================
// BUSCAR USUÁRIO POR ID (PROFISSIONAL OU CLIENTE)
// ======================================================

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -__v');

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao buscar usuário'
    });
  }
};

// ======================================================
// ATUALIZAR PERFIL DO USUÁRIO
// ======================================================

exports.updateUser = async (req, res) => {
  try {

    const userId = req.params.id;

    // segurança básica (depois melhoramos com JWT obrigatório)
    if (req.user && req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Sem permissão'
      });
    }

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
      foto: req.body.foto,
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

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash -__v');

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao atualizar usuário'
    });
  }
};

// ======================================================
// ATUALIZAR LOCALIZAÇÃO (MAPA / GPS)
// ======================================================

exports.updateLocation = async (req, res) => {
  try {

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude e longitude obrigatórias'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        latitude,
        longitude,
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(longitude),
            parseFloat(latitude)
          ]
        }
      },
      { new: true }
    );

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erro ao atualizar localização'
    });
  }
};