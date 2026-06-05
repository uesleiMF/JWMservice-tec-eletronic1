require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ==================== SOCKET IO ====================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  path: "/socket.io",
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

console.log('✅ Socket.io configurado');

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());

// ==================== MONGODB ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Mongo error:', err));

// ==================== ROTAS ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chatRoutes'));

const conversationRoutes = require('./routes/conversationRoutes');
app.use('/api/conversations', conversationRoutes);

app.use('/api/reviews', require('./routes/reviewRoutes'));

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'JW Service API funcionando 🚀' });
});

app.get('/socket-health', (req, res) => {
  res.json({
    status: 'ok',
    onlineUsers: onlineUsers.size,
    uptime: process.uptime()
  });
});

// ==================== SOCKET ====================
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // ... (seu código de socket continua igual)
  console.log('🟢 SOCKET CONECTADO:', socket.id);
  // ... resto do seu código de socket
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: https://jwmservice-tec-eletronic1.onrender.com`);
});