require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const profissionaisRoutes = require('./routes/profissionais');
const ordersRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== MONGODB ====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Mongo error:', err));

// ==================== ROTAS ====================
app.use('/api/auth', authRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messageRoutes);
app.use('/conversations', conversationRoutes);

// ==================== SOCKET STATE ====================
const onlineUsers = new Map();

// ==================== SOCKET CHAT ====================
io.on('connection', (socket) => {
  console.log(`🟢 Conectado: ${socket.id}`);

  // ================= JOIN ROOM =================
  socket.on('joinRoom', ({ conversationId, userId }) => {
    if (!conversationId || !userId) {
      console.log('❌ joinRoom inválido');
      return;
    }

    socket.join(conversationId);
    onlineUsers.set(userId, socket.id);

    console.log(`👤 ${userId} entrou na conversa ${conversationId}`);
  });

  // ================= SEND MESSAGE =================
  socket.on('sendMessage', async (data) => {
    try {
      console.log("📥 CHEGOU NO BACKEND:", data);

      const { conversationId, senderId, receiverId, text, orderId } = data;

      // 🔥 validação segura (SEM quebrar servidor)
      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        console.log('❌ Dados inválidos:', data);
        return;
      }

      const Message = require('./models/Message');

      const savedMessage = await Message.create({
        conversationId,
        senderId,
        receiverId,
        orderId: orderId || null, // 🔥 NÃO quebra mais
        text: text.trim()
      });

      console.log('✅ Mensagem salva:', savedMessage._id);

      // 🔥 envia para todos da sala
      io.to(conversationId).emit('receiveMessage', savedMessage);

    } catch (err) {
      console.error('❌ erro ao salvar mensagem:', err.message);
    }
  });

  // ================= DISCONNECT =================
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 ${userId} desconectou`);
        break;
      }
    }
  });
});

// ==================== START ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});