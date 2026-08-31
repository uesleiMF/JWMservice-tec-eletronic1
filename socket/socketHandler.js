const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const onlineUsers = new Map(); // userId -> Set de socketIds

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket conectado:", socket.id);

    // ======================================================
    // USUÁRIO ONLINE
    // ======================================================
    socket.on("user-online", (userId) => {
      if (!userId) return;

      const id = String(userId);

      if (!onlineUsers.has(id)) {
        onlineUsers.set(id, new Set());
      }

      onlineUsers.get(id).add(socket.id);
      socket.userId = id;

      // Emite a lista completa para TODOS
      io.emit("online-users", Array.from(onlineUsers.keys()));

      console.log("🟢 Usuário online:", id, "| Total:", onlineUsers.size);
    });

    // ======================================================
    // PEDIR LISTA DE ONLINE (estava faltando!)
    // ======================================================
    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("📋 Lista de online enviada para", socket.id);
    });

    // ======================================================
    // ENTRAR / SAIR DA CONVERSA
    // ======================================================
    socket.on("joinConversation", (conversationId) => {
      if (conversationId) {
        socket.join(String(conversationId));
        console.log("📌 Entrou conversa:", conversationId);
      }
    });

    socket.on("leaveConversation", (conversationId) => {
      if (conversationId) {
        socket.leave(String(conversationId));
      }
    });

    // ======================================================
    // DIGITANDO
    // ======================================================
    socket.on("typing", (data) => {
      if (data?.conversationId) {
        socket.to(String(data.conversationId)).emit("typing");
      }
    });

    socket.on("stopTyping", (data) => {
      if (data?.conversationId) {
        socket.to(String(data.conversationId)).emit("stopTyping");
      }
    });

    // ======================================================
    // ENVIAR MENSAGEM
    // ======================================================
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, senderId, receiverId, text, clientMessageId } = data;

        if (!conversationId || !senderId || !receiverId || !text?.trim()) {
          return socket.emit("error", { message: "Dados inválidos" });
        }

        // Evita duplicação
        if (clientMessageId) {
          const existente = await Message.findOne({ clientMessageId });
          if (existente) {
            return socket.emit("newMessage", existente);
          }
        }

        const message = await Message.create({
          conversationId,
          senderId,
          receiverId,
          text: text.trim(),
          clientMessageId,
          delivered: false,
          isRead: false,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        });

        io.to(String(conversationId)).emit("newMessage", message);
        console.log("💬 Mensagem criada:", message._id);
      } catch (error) {
        console.error("❌ Erro enviar mensagem:", error);
        socket.emit("error", { message: "Erro interno" });
      }
    });

    // ======================================================
    // MENSAGEM ENTREGUE
    // ======================================================
    socket.on("messageDelivered", async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.delivered) return;

        message.delivered = true;
        message.deliveredAt = new Date();
        await message.save();

        io.to(String(message.conversationId)).emit("messageStatus", {
          messageId: message._id,
          delivered: true,
          deliveredAt: message.deliveredAt,
        });

        console.log("✓ Entregue:", messageId);
      } catch (error) {
        console.error("Erro entregue:", error);
      }
    });

    // ======================================================
    // MENSAGEM VISUALIZADA
    // ======================================================
    socket.on("messageRead", async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.isRead) return;

        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        io.to(String(message.conversationId)).emit("messageStatus", {
          messageId: message._id,
          isRead: true,
          readAt: message.readAt,
        });

        console.log("👁 Visualizada:", messageId);
      } catch (error) {
        console.error("Erro leitura:", error);
      }
    });

    // ======================================================
    // DESCONECTAR
    // ======================================================
    socket.on("disconnect", () => {
      if (socket.userId) {
        const sockets = onlineUsers.get(socket.userId);

        if (sockets) {
          sockets.delete(socket.id);

          if (sockets.size === 0) {
            onlineUsers.delete(socket.userId);
          }
        }

        // Atualiza a lista para todos
        io.emit("online-users", Array.from(onlineUsers.keys()));
      }

      console.log("🔴 Socket desconectado:", socket.id);
    });
  });
};