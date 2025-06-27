const Professional = require('../models/Professional');

// Buscar profissional por ID
exports.findById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }
    res.json(professional);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar profissional' });
  }
};

// Buscar profissionais próximos
exports.findNearby = async (req, res) => {
  try {
    const professionals = await Professional.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [req.longitude, req.latitude],
          },
          $maxDistance: 10000, // 10 km
        },
      },
      paid: true,
    });

    res.json(professionals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar perfil do profissional
exports.updateProfile = async (req, res) => {
  try {
    const updated = await Professional.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Erro ao atualizar perfil' });
  }
};
