const Message = require('../models/Message');

// @desc    Get recent chat history
// @route   GET /api/messages
exports.getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const messages = await Message.find().sort({ timestamp: 1 }).limit(limit);
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Server Error: Unable to fetch messages' });
  }
};
