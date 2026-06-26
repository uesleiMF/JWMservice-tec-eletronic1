const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token não fornecido ou mal formatado'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        message: 'Usuário não encontrado'
      });
    }

    // ======================================================
    // PADRÃO ÚNICO (IMPORTANTE)
    // ======================================================
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    next();

  } catch (err) {
    console.error('Auth error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expirado. Faça login novamente.'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token inválido.'
      });
    }

    return res.status(401).json({
      message: 'Não autorizado'
    });
  }
};

module.exports = { protect };