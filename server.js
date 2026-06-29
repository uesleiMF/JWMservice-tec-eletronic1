require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(express.json());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jw-mservice-tec-eletric2.vercel.app',
      'https://jw-mservice-tec-eletric2-6koimn7gx-uesleimfs-projects.vercel.app',
      'https://*.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
);

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jw-mservice-tec-eletric2.vercel.app',
      'https://*.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
});

console.log('✅ Socket.io configurado com pingTimeout:', 60000);

// ==================== BANCO DE DADOS ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado com sucesso'))
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB:', err);
    process.exit(1);
  });

// ==================== ROTAS ====================
const authRoutes = require('./routes/auth');
const profissionalRoutes = require('./routes/profissionais');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chatRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/profissionais', profissionalRoutes);   // ← Muito importante
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reviews', reviewRoutes);

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'JW Service API funcionando 🚀',
    version: '1.0.0',
  });
});

app.get('/socket-health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    sockets: io.engine.clientsCount,
  });
});

// ==================== SOCKET.IO EVENTS ====================
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🟢 SOCKET CONECTADO: ${socket.id}`);

  socket.on('authenticate', (userId) => {
    if (!userId) return;
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);
  });

  socket.on('joinConversation', (conversationId) => {
    if (conversationId) socket.join(String(conversationId));
  });

  socket.on('leaveConversation', (conversationId) => {
    if (conversationId) socket.leave(String(conversationId));
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;
      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        return socket.emit('error', { message: 'Dados inválidos' });
      }

      const message = new Message({
        conversationId,
        senderId,
        receiverId,
        text: text.trim(),
      });

      await message.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });

      io.to(String(conversationId)).emit('newMessage', message);

      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', message);
      }
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      socket.emit('error', { message: 'Erro interno' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) onlineUsers.delete(String(socket.userId));
    console.log(`🔴 SOCKET DESCONECTADO: ${socket.id}`);
  });
});

// ==================== ERRO GLOBAL ====================
app.use((err, req, res, next) => {
  console.error('❌ Erro global:', err);
  res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

// ==================== START SERVER ====================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API: https://jwmservice-tec-eletronic1.onrender.com`);
});