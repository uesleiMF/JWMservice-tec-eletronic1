const Message = require('./models/Message');
const LocationLog = require('./models/LocationLog');

const usersOnline = new Map();

function initialize(io) {
  io.on('connection', (socket) => {
    console.log('Conectado:', socket.id);

    socket.on('register', (userId) => {
      usersOnline.set(userId, socket.id);
      console.log(`Usuário ${userId} conectado com socket ${socket.id}`);
    });

    socket.on('locationUpdate', async ({ userId, coords }) => {
      try {
        await LocationLog.create({ user: userId, coords });
      } catch (err) {
        console.error('Erro ao salvar localização:', err);
      }
      socket.broadcast.emit('professionalLocation', { userId, coords });
    });

    socket.on('sendMessage', async ({ senderId, receiverId, content, serviceId }) => {
      try {
        const message = await Message.create({ sender: senderId, receiver: receiverId, content, service: serviceId });
        const receiverSocketId = usersOnline.get(receiverId);
        if (receiverSocketId) io.to(receiverSocketId).emit('newMessage', message);
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
      }
    });

    socket.on('sendNotification', ({ toUserId, message }) => {
      const socketId = usersOnline.get(toUserId);
      if (socketId) io.to(socketId).emit('notification', { message });
    });

    socket.on('disconnect', () => {
      for (const [key, value] of usersOnline.entries()) {
        if (value === socket.id) usersOnline.delete(key);
      }
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });
}

module.exports = { initialize, usersOnline };
