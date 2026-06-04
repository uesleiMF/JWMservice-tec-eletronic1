require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chatRoutes');


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

app.use('/api/chat', chatRoutes);

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
    let { conversationId, senderId, receiverId, text } = data;

    if (!senderId || !receiverId || !text?.trim()) {
      return socket.emit('messageError', {
        error: 'Dados inválidos'
      });
    }

    const Conversation = require('./models/Conversation');
    const Message = require('./models/Message');

    // Procura conversa existente
    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    // Se não existir, cria automaticamente
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        lastMessageAt: new Date()
      });

      conversationId = conversation._id;

      console.log(
        '💬 Nova conversa criada:',
        conversationId
      );
    }

    // Salva mensagem
    const savedMessage = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim()
    });

    // Atualiza conversa
    conversation.lastMessage = savedMessage._id;
    conversation.lastMessageAt = savedMessage.createdAt;

    await conversation.save();

    console.log(
      '✅ Mensagem salva:',
      savedMessage._id
    );

    // Garante que os usuários estejam na sala
    socket.join(conversationId.toString());

    io.to(conversationId.toString()).emit(
      'receiveMessage',
      savedMessage
    );

    io.to(receiverId).emit(
      'newMessageNotification',
      {
        conversationId,
        senderId,
        text: savedMessage.text,
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