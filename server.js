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
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Mongo error:', err));

// ==================== ROTAS ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/orders', require('./routes/orders'));

// Conversas
const conversationRoutes = require('./routes/conversationRoutes');
app.use('/api/conversations', conversationRoutes);

// Avaliações (Reviews) - Novo
app.use('/api/reviews', require('./routes/reviewRoutes'));
// ==================== SOCKET ====================
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 SOCKET CONECTADO:', socket.id);

  socket.on('join', ({ userId }) => {
    if (!userId) return;
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    console.log('👤 ONLINE:', userId);
  });

  socket.on('joinRoom', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`💬 Entrou na sala: ${conversationId}`);
  });

  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('typing', { userId });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    socket.to(conversationId).emit('stopTyping');
  });

  // ==================== ENVIAR MENSAGEM ====================
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;

      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        return socket.emit('messageError', { error: 'Dados inválidos' });
      }

      const Message = require('./models/Message');
      const savedMessage = await Message.create({
        conversationId,
        senderId,
        receiverId,
        text: text.trim()
      });

      // Atualiza última mensagem na Conversation
      const Conversation = require('./models/Conversation');
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: savedMessage._id,
        lastMessageAt: savedMessage.createdAt
      });

      console.log('✅ Mensagem salva e enviada:', savedMessage._id);

      // Emite para TODOS na sala (incluindo quem enviou)
      io.to(conversationId).emit('receiveMessage', savedMessage);

      // Notificação para o outro usuário
      io.to(receiverId).emit('newMessageNotification', {
        conversationId,
        senderId,
        text: text.trim(),
        createdAt: savedMessage.createdAt
      });

    } catch (err) {
      console.error('❌ ERRO AO SALVAR MENSAGEM:', err);
      socket.emit('messageError', { error: 'Erro ao enviar mensagem' });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log('🔴 OFFLINE:', userId);
        break;
      }
    }
    console.log('🔌 SOCKET DESCONECTADO:', socket.id);
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
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});