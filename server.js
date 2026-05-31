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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/conversations', require('./routes/conversationRoutes'));


// ==================== ONLINE USERS ====================
const onlineUsers = new Map();

// ==================== SOCKET ====================
io.on('connection', (socket) => {
  console.log('🟢 SOCKET CONECTADO:', socket.id);

  // ================= JOIN USER =================
  socket.on('join', ({ userId }) => {
    if (!userId) return;

    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    console.log('👤 ONLINE:', userId);
    console.log('📡 ROOMS:', socket.rooms);
  });

  // ================= JOIN ROOM =================
  socket.on('joinRoom', ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;

    socket.join(conversationId);

    console.log(`💬 ROOM ENTRADA: ${conversationId}`);
    console.log(`👤 USER: ${userId}`);
    console.log('📡 ROOMS ATUAIS:', socket.rooms);
  });

  // ================= TYPING =================
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('typing', { userId });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    socket.to(conversationId).emit('stopTyping');
  });

  // ================= SEND MESSAGE =================
  socket.on('sendMessage', async (data) => {
    try {
      const {
        conversationId,
        senderId,
        receiverId,
        text,
        orderId
      } = data;

      // 🔥 VALIDAÇÃO FORTE
      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        console.log('❌ DADOS INVÁLIDOS');
        return;
      }

      const Message = require('./models/Message');

      const savedMessage = await Message.create({
        conversationId,
        senderId,
        receiverId,
        orderId: orderId || null,
        text: text.trim()
      });

      console.log('💾 SALVO:', savedMessage._id);

      // 🔥 ENVIA PARA TODOS DA CONVERSA
      io.to(conversationId).emit('receiveMessage', savedMessage);

      // 🔥 GARANTIA EXTRA (ENTREGA DIRETA)
      io.to(receiverId).emit('receiveMessage', savedMessage);

      // 🔔 NOTIFICAÇÃO
      io.to(receiverId).emit('newMessageNotification', savedMessage);

    } catch (err) {
      console.error('❌ ERRO AO SALVAR MENSAGEM:', err);
    }
  });

  // ================= DISCONNECT =================
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log('🔴 OFFLINE:', userId);
        break;
      }
    }
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});