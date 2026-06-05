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
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ==================== SOCKET EVENTS ====================
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🟢 SOCKET CONECTADO: ${socket.id}`);

  // Autenticação do usuário
  socket.on('authenticate', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`👤 Usuário autenticado: ${userId}`);
    }
  });

  // Entrar na sala da conversa
  socket.on('joinConversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`📌 Usuário ${socket.userId} entrou na conversa: ${conversationId}`);
    }
  });

  // Sair da sala
  socket.on('leaveConversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  // Enviar mensagem
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;

      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        return socket.emit('error', { message: 'Dados da mensagem incompletos' });
      }

      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');

      // Salvar mensagem
      const message = new Message({
        conversationId,
        senderId,
        receiverId,
        text: text.trim()
      });

      await message.save();

      // Atualizar conversa
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date()
      });

      // Enviar para todos na sala da conversa
      io.to(conversationId).emit('newMessage', message);

      console.log(`✅ Mensagem enviada na conversa ${conversationId}`);

    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      socket.emit('error', { message: 'Erro interno ao enviar mensagem' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
    console.log(`🔴 Socket desconectado: ${socket.id}`);
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: https://jwmservice-tec-eletronic1.onrender.com`);
});