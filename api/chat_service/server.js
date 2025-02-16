// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('../config/db');
const ChatRouter = require('./routes/chatRoute');

const app = express();

// Cấu hình middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/', ChatRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'production' ? {} : err.stack 
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on('sendMessage', (data) => {
    console.log('Received sendMessage from client:', data);
    const { groupId } = data;
    socket.to(groupId).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

module.exports = app;
