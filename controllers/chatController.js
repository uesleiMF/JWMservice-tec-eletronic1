const Message = require('../models/Message');

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    socket.on('send_message', async (data) => {
      const message = new Message(data);
      await message.save();
      io.to(data.to).emit('receive_message', message);
    });

    socket.on('join', (userId) => {
      socket.join(userId);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
};
