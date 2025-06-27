const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const http = require('http');
const { Server } = require('socket.io');
const { usersOnline, initialize } = require('./socketHandlers');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Inicializa Socket.IO
initialize(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = { io, usersOnline };
