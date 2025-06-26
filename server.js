// backend/server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const paymentRoutes = require('./routes/paymentRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const authRoutes = require('./routes/authRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { setupSocket } = require('./controllers/chatController');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

setupSocket(io);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Mongo conectado'));

app.use('/api', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', protectedRoutes);
app.use('/api', professionalRoutes);
app.use('/api', reviewRoutes);
app.use('/api', orderRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
