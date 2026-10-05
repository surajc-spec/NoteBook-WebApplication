const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const noteRoutes = require('./routes/noteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const setupChatSocket = require('./sockets/chatSocket');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// Cross-Origin configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in allowedOrigins
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev friendly
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup Real-time Chat Socket pipeline
setupChatSocket(io);

// REST API routes
app.use('/api/notes', noteRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Personal Notebook Platform',

  });
});

// Hardware detection endpoint for PC
const { execSync } = require('child_process');
let cachedPCModel = null;

app.get('/api/device/host-hardware', (req, res) => {
  if (cachedPCModel) {
    return res.status(200).json({ model: cachedPCModel });
  }

  try {
    if (process.platform === 'win32') {
      const rawModel = execSync('powershell.exe -NoProfile -Command "(Get-CimInstance Win32_ComputerSystem).Model"', {
        encoding: 'utf8',
        timeout: 3000,
      }).trim();

      if (rawModel.toLowerCase().includes('vivobook')) {
        cachedPCModel = 'Asus Vivobook 15';
      } else {
        cachedPCModel = rawModel || 'Asus Vivobook 15';
      }
    } else if (process.platform === 'darwin') {
      cachedPCModel = 'MacBook Pro';
    } else {
      cachedPCModel = 'PC Desktop';
    }
  } catch (err) {
    cachedPCModel = 'Asus Vivobook 15';
  }

  res.status(200).json({ model: cachedPCModel });
});


// Serve frontend in production or if dist exists
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Notebook Service running on port ${PORT}`);
  console.log(`📡 Realtime workspace pipeline initialized`);
  console.log(`=========================================`);
});

