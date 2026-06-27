const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    } else {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded._id)
      .select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT Error:", err.name, err.message);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = { protect };