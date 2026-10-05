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

        // Universal Commercial Hardware Model Resolver
        let cleanModel = (deviceInfo?.model || '').trim();

        // 1. OPPO & OnePlus
        if (/CPH27\d\d|2721/i.test(cleanModel)) cleanModel = 'OPPO F29';
        else if (/CPH2635/i.test(cleanModel)) cleanModel = 'OPPO F27 Pro+';
        else if (/CPH2603/i.test(cleanModel)) cleanModel = 'OPPO F25 Pro';
        else if (/CPH2581/i.test(cleanModel)) cleanModel = 'OnePlus 12';
        else if (/CPH2609/i.test(cleanModel)) cleanModel = 'OnePlus 12R';
        else if (/CPH2449/i.test(cleanModel)) cleanModel = 'OnePlus 11';
        // 2. Samsung Galaxy
        else if (/SM-S928/i.test(cleanModel)) cleanModel = 'Samsung Galaxy S24 Ultra';
        else if (/SM-S92/i.test(cleanModel)) cleanModel = 'Samsung Galaxy S24';
        else if (/SM-S918/i.test(cleanModel)) cleanModel = 'Samsung Galaxy S23 Ultra';
        else if (/SM-S91/i.test(cleanModel)) cleanModel = 'Samsung Galaxy S23';
        else if (/SM-S90/i.test(cleanModel)) cleanModel = 'Samsung Galaxy S22';
        else if (/SM-F9/i.test(cleanModel)) cleanModel = 'Samsung Galaxy Z Fold';
        else if (/SM-F7/i.test(cleanModel)) cleanModel = 'Samsung Galaxy Z Flip';
        else if (/SM-A5/i.test(cleanModel)) cleanModel = 'Samsung Galaxy A55';
        else if (/SM-A3/i.test(cleanModel)) cleanModel = 'Samsung Galaxy A35';
        // 3. Vivo & iQOO
        else if (/V2324/i.test(cleanModel)) cleanModel = 'Vivo X100 Pro';
        else if (/V23/i.test(cleanModel)) cleanModel = 'Vivo V30';
        else if (/I22/i.test(cleanModel)) cleanModel = 'iQOO 12';
        // 4. Xiaomi, Redmi, POCO
        else if (/2311DRK48G/i.test(cleanModel)) cleanModel = 'POCO X6 Pro';
        else if (/2312DRA50G/i.test(cleanModel)) cleanModel = 'Redmi Note 13 Pro+';
        else if (/23116PN5BC|23127PN0CG/i.test(cleanModel)) cleanModel = 'Xiaomi 14';
        // 5. Realme
        else if (/RMX3840/i.test(cleanModel)) cleanModel = 'Realme 12 Pro+';
        else if (/RMX/i.test(cleanModel)) cleanModel = 'Realme';
        // 6. PC / Desktop fallback
        else if (cleanModel === 'PC Desktop' || cleanModel === 'Windows PC' || (!cleanModel && !deviceInfo?.isMobile)) {
          cleanModel = 'Asus Vivobook 15';
        } else if (!cleanModel) {
          cleanModel = deviceInfo?.isMobile ? 'OPPO F29' : 'Asus Vivobook 15';
        }


        // Persist message with clean device telemetry to MongoDB
        const savedMessage = await Message.create({
          senderId,
          text: text.trim(),
          timestamp: new Date(),
          deviceInfo: {
            isMobile: !!deviceInfo?.isMobile,
            model: cleanModel,
          },
        });

        console.log(`[Socket.io] Message saved: ${savedMessage._id} from ${cleanModel}`);


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
