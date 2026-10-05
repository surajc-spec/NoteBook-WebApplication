const Message = require('../models/Message');

const setupChatSocket = (io) => {
  const PRIVATE_ROOM = 'private-chat-room';

  io.on('connection', (socket) => {
    console.log(`[Socket.io] New client connected: ${socket.id}`);

    // Join the private pipeline room
    socket.on('join_room', (data) => {
      socket.join(PRIVATE_ROOM);
      console.log(`[Socket.io] Socket ${socket.id} (${data?.senderId || 'anon'}) joined ${PRIVATE_ROOM}`);
      
      // Optionally announce peer presence discretely
      socket.to(PRIVATE_ROOM).emit('peer_joined', {
        senderId: data?.senderId,
        timestamp: new Date(),
      });
    });

    // Handle sending a message
    socket.on('send_message', async (data, callback) => {
      try {
        const { senderId, text, deviceInfo } = data;

        if (!senderId || !text || !text.trim()) {
          if (callback) callback({ success: false, error: 'Message text and senderId are required' });
          return;
        }

        // Persist message with device telemetry to MongoDB
        const savedMessage = await Message.create({
          senderId,
          text: text.trim(),
          timestamp: new Date(),
          deviceInfo: {
            isMobile: !!deviceInfo?.isMobile,
            model: deviceInfo?.model || 'Generic Device',
          },
        });

        console.log(`[Socket.io] Message saved and broadcasting: ${savedMessage._id} from ${deviceInfo?.model || 'Unknown'}`);

        // Broadcast to the other user in the private-chat-room
        socket.to(PRIVATE_ROOM).emit('receive_message', savedMessage);

        // Acknowledge back to sender with persisted document
        if (callback) {
          callback({ success: true, data: savedMessage });
        }
      } catch (error) {
        console.error('[Socket.io] Error saving/broadcasting message:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to process message' });
        }
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(PRIVATE_ROOM).emit('peer_typing', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupChatSocket;
