const Professional = require('../models/Professional');

exports.findNearby = async (req, res) => {
  const { longitude, latitude, specialty } = req.query;
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        $maxDistance: 10000
      }
    }
  };
  if (specialty) query.specialty = specialty;
  const professionals = await Professional.find(query);
  res.json(professionals);
};

exports.updateProfile = async (req, res) => {
  try {
    const updated = await Professional.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
