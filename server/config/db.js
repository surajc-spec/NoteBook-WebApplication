const mongoose = require('mongoose');

const connectDB = async () => {
  let primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatApp';
  
  // If URI has unencoded @@ in password, auto-encode the password's @ symbol
  if (primaryUri.includes('@@')) {
    primaryUri = primaryUri.replace('@@', '%40@');
  }

  const fallbackUri = process.env.FALLBACK_MONGODB_URI || 'mongodb://localhost:27017/chatApp';

  try {
    console.log('[Database] Connecting to primary MongoDB URI...');
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Database] MongoDB Atlas Connected Successfully!');
  } catch (error) {
    console.warn(`[Database] Primary MongoDB Connection Warning: ${error.message}`);
    console.log('[Database] Switching to fallback local MongoDB instance...');
    try {
      await mongoose.connect(fallbackUri);
      console.log(`[Database] Connected to Local MongoDB successfully (${fallbackUri})`);
    } catch (fallbackError) {
      console.error(`[Database] Critical: Could not connect to fallback database: ${fallbackError.message}`);
    }
  }
};

module.exports = connectDB;
