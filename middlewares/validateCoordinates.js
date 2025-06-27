module.exports = (req, res, next) => {
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);
  
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Latitude e longitude inválidas' });
    }
  
    req.latitude = lat;
    req.longitude = lng;
    next();
  };
  