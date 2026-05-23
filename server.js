require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profissionaisRoutes = require('./routes/profissionais');
const ordersRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');

const app = express();
app.use(cors());
app.use(express.json());

// HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

// ROTAS
app.use('/api/auth', authRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messageRoutes);

// SOCKET CHAT
const usersOnline = {};

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // registrar usuário
  socket.on('join', (userId) => {
    usersOnline[userId] = socket.id;
  });

  // enviar mensagem
  socket.on('sendMessage', (data) => {
    const { receiverId } = data;

    const receiverSocket = usersOnline[receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit('receiveMessage', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectou:', socket.id);
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});