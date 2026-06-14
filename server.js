require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jwmservice-tec-eletronic1.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

console.log('✅ Socket.io configurado');

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jwmservice-tec-eletronic1.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
);

app.use(express.json());

// ==================== MONGODB ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// ==================== MODELS ====================
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// ==================== ROTAS ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// ==================== HEALTH ====================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'JW Service API funcionando 🚀',
  });
});

app.get('/socket-health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

// ==================== SOCKET LOGIC ====================
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🟢 SOCKET CONECTADO: ${socket.id}`);

  // ==================== AUTENTICAÇÃO ====================
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

  // ==================== ENTRAR NA CONVERSA ====================
  socket.on('joinConversation', (conversationId) => {
    try {
      if (!conversationId) return;
      socket.join(String(conversationId));
      console.log(`📌 Usuário ${socket.userId} entrou na conversa ${conversationId}`);
    } catch (err) {
      console.error('Erro joinConversation:', err);
    }
  });

  // ==================== SAIR DA CONVERSA ====================
  socket.on('leaveConversation', (conversationId) => {
    try {
      if (!conversationId) return;
      socket.leave(String(conversationId));
      console.log(`🚪 Usuário ${socket.userId} saiu da conversa ${conversationId}`);
    } catch (err) {
      console.error('Erro leaveConversation:', err);
    }
  });

  // ==================== ENVIAR MENSAGEM (PRINCIPAL) ====================
  socket.on('sendMessage', async (data) => {
    console.log('📨 RECEBIDO NO BACKEND:', data);

    try {
      const { conversationId, senderId, receiverId, text } = data;

      if (!conversationId || !senderId || !receiverId || !text?.trim()) {
        console.log('❌ DADOS INVÁLIDOS');
        return socket.emit('error', { message: 'Dados da mensagem incompletos' });
      }

      // Criar mensagem
      const message = new Message({
        conversationId,
        senderId,
        receiverId,
        text: text.trim(),
      });

      await message.save();

      // Atualizar última mensagem da conversa
      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        },
        { new: true }
      );

      const messageToSend = message; // Pode fazer populate se quiser nome/foto

      // 1. Envia para todos que estão na sala da conversa
      io.to(String(conversationId)).emit('newMessage', messageToSend);

      // 2. Fallback: Envia diretamente para o receiver (mesmo se não estiver na sala)
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId && receiverSocketId !== socket.id) {
        io.to(receiverSocketId).emit('newMessage', messageToSend);
        console.log(`📤 Mensagem enviada DIRETAMENTE para receiver: ${receiverId}`);
      }

      console.log(`✅ Mensagem salva e enviada na conversa ${conversationId}`);
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      socket.emit('error', { message: 'Erro interno ao enviar mensagem' });
    }
  });

  // ==================== DESCONECTAR ====================
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

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('🌐 URL: https://jwmservice-tec-eletronic1.onrender.com');
});