const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('../config/db');
const ChatRouter = require('./routes/chatRoute');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

const setupSocketHandlers = require('../services/Socket');
setupSocketHandlers(io);

const port = process.env.CHAT_PORT || 3009;

app.use(cors({ origin: "*", credentials: true }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('socketio', io);

app.use('/api/chat', ChatRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: process.env.NODE_ENV === 'production' ? {} : err.stack });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Chat Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };