require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ==================== CONFIGURAÇÕES GLOBAIS ====================
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(express.json());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jw-mservice-tec-eletric2-6koimn7gx-uesleimfs-projects.vercel.app',
      'https://jw-mservice-tec-eletric2.vercel.app',
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
      'https://jw-mservice-tec-eletric2-6koimn7gx-uesleimfs-projects.vercel.app',
      'https://jw-mservice-tec-eletric2.vercel.app',
      'https://*.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

console.log('✅ Socket.io configurado');

// ==================== BANCO DE DADOS ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado com sucesso'))
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB:', err);
    process.exit(1); // Encerra se não conseguir conectar
  });

// ==================== MODELOS ====================
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// ==================== ROTAS ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// ==================== ROTAS DE HEALTH ====================
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

// ==================== SOCKET LOGIC ====================
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🟢 SOCKET CONECTADO: ${socket.id}`);

  // Autenticação
  socket.on('authenticate', (userId) => {
    try {
      if (!userId) return;
      onlineUsers.set(String(userId), socket.id);
      socket.userId = String(userId);
      console.log(`👤 Usuário autenticado: ${userId} | Socket: ${socket.id}`);
    } catch (err) {
      console.error('Erro authenticate:', err);
    }
  });

  // Entrar na conversa
  socket.on('joinConversation', (conversationId) => {
    try {
      if (!conversationId) return;
      socket.join(String(conversationId));
      console.log(`📌 Usuário ${socket.userId} entrou na conversa ${conversationId}`);
    } catch (err) {
      console.error('Erro joinConversation:', err);
    }
  });

  // Sair da conversa
  socket.on('leaveConversation', (conversationId) => {
    try {
      if (!conversationId) return;
      socket.leave(String(conversationId));
      console.log(`🚪 Usuário ${socket.userId} saiu da conversa ${conversationId}`);
    } catch (err) {
      console.error('Erro leaveConversation:', err);
    }
  });

  // Enviar mensagem
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;

      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        return socket.emit('error', { message: 'Dados da mensagem incompletos' });
      }

      const message = new Message({
        conversationId,
        senderId,
        receiverId,
        text: text.trim(),
      });

      await message.save();

      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        },
        { new: true }
      );

      // Envia para todos na sala
      io.to(String(conversationId)).emit('newMessage', message);

      // Envio direto para receiver (fallback)
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId && receiverSocketId !== socket.id) {
        io.to(receiverSocketId).emit('newMessage', message);
      }

      console.log(`✅ Mensagem enviada na conversa ${conversationId}`);
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      socket.emit('error', { message: 'Erro interno ao enviar mensagem' });
    }
  });

  // Desconexão
  socket.on('disconnect', (reason) => {
    try {
      if (socket.userId) {
        onlineUsers.delete(String(socket.userId));
      }
      console.log(`🔴 SOCKET DESCONECTADO: ${socket.id} (${reason})`);
    } catch (err) {
      console.error('Erro disconnect:', err);
    }
  });
});

// ==================== MIDDLEWARE DE ERRO (final) ====================
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
  });
});

// ==================== INICIAR SERVIDOR ====================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: https://jwmservice-tec-eletronic1.onrender.com`);
});