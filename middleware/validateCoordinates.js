// middlewares/validateCoordinates.js
function validateCoordinates(req, res, next) {
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);
  
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Latitude e longitude inválidas' });
    }
  
    // Pode salvar os valores convertidos no req para usar depois
    req.latitude = lat;
    req.longitude = lng;
  
    next();
  }
  
  module.exports = validateCoordinates;
  