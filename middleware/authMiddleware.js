const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token não fornecido ou mal formatado. Use: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Adiciona o usuário na requisição
    req.user = user;
    req.user.id = user._id.toString();   // importante para o controller

    next();
  } catch (err) {
    console.error('Erro no authMiddleware:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    res.status(401).json({ message: 'Não autorizado' });
  }
};

module.exports = { protect };