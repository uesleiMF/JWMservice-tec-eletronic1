const Message = require('../models/Message');

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🟢 Usuário conectado: ${socket.id}`);

    // Entrar na sala do pedido (order)
    socket.on('join_order', (orderId) => {
      socket.join(orderId);
      console.log(`👤 Usuário entrou na sala do pedido: ${orderId}`);
    });

    // Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, orderId, text } = data;

        // Validação básica
        if (!senderId || !receiverId || !orderId || !text) {
          return socket.emit('error', { message: 'Faltam dados obrigatórios' });
        }

        const messageData = {
          senderId,
          receiverId,
          orderId,
          text: text.trim()
        };

        const message = new Message(messageData);
        const savedMessage = await message.save();

        console.log('📨 Mensagem salva e enviada na sala', orderId);

        // Envia para todos na sala do pedido (incluindo o remetente)
        io.to(orderId).emit('receive_message', savedMessage);

      } catch (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        socket.emit('error', { message: 'Erro ao salvar mensagem' });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Cliente desconectado:', socket.id);
    });
  });
};