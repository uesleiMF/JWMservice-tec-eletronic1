require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));
const corsOptions = {
    origin(origin, callback) {

        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://jw-mservice-tec-eletric2.vercel.app'
        ];

        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app')
        ) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With'
    ]
};

app.use(cors(corsOptions));

// Compatível com Express 5
app.options(/.*/, cors(corsOptions));


// ==================== SOCKET ====================

const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    pingTimeout: 60000,
    pingInterval: 25000
});

console.log('✅ Socket.IO iniciado');


// ==================== MONGODB ====================

mongoose
.connect(process.env.MONGO_URI)
.then(() => {

    console.log('✅ MongoDB conectado');

})
.catch(err => {

    console.error(err);

    process.exit(1);

});


// ==================== ROTAS ====================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));


// ==================== HEALTH ====================

app.get('/', (req, res) => {

    res.json({

        status: 'online',
        message: 'JW Service API funcionando 🚀',
        version: '1.0.0'

    });

});

app.get('/socket-health', (req, res) => {

    res.json({

        status: 'ok',
        uptime: process.uptime(),
        sockets: io.engine.clientsCount

    });

});


// ==================== SOCKET EVENTS ====================

const onlineUsers = new Map();

io.on('connection', socket => {

    console.log('🟢 Conectado:', socket.id);

    socket.on('authenticate', userId => {

        if (!userId) return;

        socket.userId = String(userId);

        onlineUsers.set(String(userId), socket.id);

    });

    socket.on('joinConversation', conversationId => {

        if (conversationId)
            socket.join(String(conversationId));

    });

    socket.on('leaveConversation', conversationId => {

        if (conversationId)
            socket.leave(String(conversationId));

    });

    socket.on('sendMessage', async data => {

        try {

            const {
                conversationId,
                senderId,
                receiverId,
                text
            } = data;

            if (
                !conversationId ||
                !senderId ||
                !receiverId ||
                !text?.trim()
            ) {

                return socket.emit('error', {

                    message: 'Dados inválidos'

                });

            }

            const message = await Message.create({

                conversationId,
                senderId,
                receiverId,
                text: text.trim()

            });

            await Conversation.findByIdAndUpdate(

                conversationId,

                {

                    lastMessage: message._id,
                    lastMessageAt: new Date()

                }

            );

            io.to(String(conversationId))
              .emit('newMessage', message);

            const receiverSocket = onlineUsers.get(String(receiverId));

            if (receiverSocket) {

                io.to(receiverSocket)
                  .emit('newMessage', message);

            }

        }

        catch (err) {

            console.error(err);

            socket.emit('error', {

                message: 'Erro interno'

            });

        }

    });

    socket.on('disconnect', () => {

        if (socket.userId)
            onlineUsers.delete(socket.userId);

        console.log('🔴 Desconectado:', socket.id);

    });

});


// ==================== ERRO ====================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,
        message: err.message || 'Erro interno do servidor'

    });

});


// ==================== START ====================

server.listen(PORT, '0.0.0.0', () => {

    console.log(`🚀 Servidor iniciado na porta ${PORT}`);

    console.log(`🌐 http://localhost:${PORT}`);

});