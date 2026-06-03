require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// ==================== SOCKET IO ====================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== MONGODB ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
  })
  .catch((err) => {
    console.error('❌ Mongo error:', err);
  });

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
  });

  // ================= JOIN ROOM =================
  socket.on('joinRoom', ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;

    socket.join(conversationId);

    console.log(`💬 ROOM: ${conversationId}`);
    console.log(`👤 USER: ${userId}`);
  });

  // ================= TYPING =================
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('typing', {
      userId
    });
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
        text
      } = data;

      if (
        !conversationId ||
        !senderId ||
        !receiverId ||
        !text?.trim()
      ) {
        console.log('❌ Dados inválidos');

        socket.emit('messageError', {
          error: 'Dados inválidos para envio'
        });

        return;
      }

      const savedMessage = await Message.create({
        conversationId,
        senderId,
        receiverId,
        text: text.trim()
      });

      console.log(
        '💾 MENSAGEM SALVA:',
        savedMessage._id
      );

      // envia para todos que estão na conversa
      io.to(conversationId).emit(
        'receiveMessage',
        savedMessage
      );

      // garantia extra para destinatário
      io.to(receiverId).emit(
        'receiveMessage',
        savedMessage
      );

      // notificação
      io.to(receiverId).emit(
        'newMessageNotification',
        {
          conversationId,
          senderId,
          text: text.trim(),
          createdAt: savedMessage.createdAt
        }
      );

    } catch (err) {
      console.error(
        '❌ ERRO AO SALVAR MENSAGEM:',
        err
      );

      socket.emit('messageError', {
        error: 'Erro ao enviar mensagem'
      });
    }
  });

  // ================= LEAVE ROOM =================
  socket.on('leaveRoom', ({ conversationId }) => {
    if (!conversationId) return;

    socket.leave(conversationId);

    console.log(
      `🚪 Saiu da sala: ${conversationId}`
    );
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

    console.log(
      '🔌 SOCKET DESCONECTADO:',
      socket.id
    );
  });
});

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'JW Service API funcionando 🚀'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT}`
  );
});