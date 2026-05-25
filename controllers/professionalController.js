const Professional = require('../models/Professional');

// Buscar profissional por ID
exports.findById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .select('-password -__v') // remove campos sensíveis
      .populate('userId', 'name email phone'); // se tiver relação com User

    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(professional);
  } catch (err) {
    console.error('Erro ao buscar profissional:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar profissionais próximos
exports.findNearby = async (req, res) => {
  try {
    const { latitude, longitude, distance = 10000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }

    const professionals = await Professional.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(distance),
        },
      },
      paid: true,
      active: true,        // recomendo adicionar esse filtro
    })
    .select('name photo specialty rating location address priceRange')
    .limit(20); // limite para não retornar todos

    res.json(professionals);
  } catch (err) {
    console.error('Erro ao buscar profissionais próximos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar perfil do profissional
exports.updateProfile = async (req, res) => {
  try {
    // Segurança: só permite atualizar o próprio perfil
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para atualizar este perfil' });
    }

    const updated = await Professional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -__v');

    if (!updated) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos', details: err.message });
    }
    
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};