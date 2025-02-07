module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.id} joined group ${groupId}`);
    });

    socket.on('sendMessage', (data) => {
      const { groupId, senderId, content } = data;
      io.to(groupId).emit('newMessage', {
        sender: { id: senderId },
        content,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};