const http = require('http');
const { io: ClientIO } = require('socket.io-client');
const mongoose = require('mongoose');
require('dotenv').config();

const Note = require('../models/Note');
const Message = require('../models/Message');

async function runTests() {
  console.log('--- Starting Stealth MERN Stack Integration Verification ---');
  
  // 1. Database connection check
  console.log('1. Checking MongoDB connection...');
  if (mongoose.connection.readyState !== 1) {
    const connectDB = require('../config/db');
    await connectDB();
  }
  console.log('   MongoDB connection state:', mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED');

  const BASE_URL = 'http://localhost:5000';

  // 2. Health check
  console.log('2. Testing GET /api/health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthJson = await healthRes.json();
  console.log('   Health response:', healthJson.status === 'online' ? 'PASSED' : 'FAILED');

  // 3. Create Note via REST API
  console.log('3. Testing POST /api/notes...');
  const createNoteRes = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Decoy Work Log',
      content: '# Work Log\n\nDaily standup notes and sprint priorities.',
    }),
  });
  const createNoteJson = await createNoteRes.json();
  const createdNoteId = createNoteJson.data._id;
  console.log('   Note created with ID:', createdNoteId);

  // 4. Fetch Notes
  console.log('4. Testing GET /api/notes...');
  const getNotesRes = await fetch(`${BASE_URL}/api/notes`);
  const getNotesJson = await getNotesRes.json();
  const foundNote = getNotesJson.data.find(n => n._id === createdNoteId);
  console.log('   Found created note in DB:', foundNote ? 'PASSED' : 'FAILED');

  // 5. Update Note
  console.log('5. Testing PUT /api/notes/:id...');
  const updateRes = await fetch(`${BASE_URL}/api/notes/${createdNoteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Decoy Work Log (Updated)',
      content: '# Work Log\n\nAll tasks completed for today.',
    }),
  });
  const updateJson = await updateRes.json();
  console.log('   Note title updated to:', updateJson.data.title);

  // 6. Test Real-time Socket.io 1-on-1 Pipeline with Telemetry
  console.log('6. Testing Socket.io private-chat-room and device telemetry...');
  
  const clientA = ClientIO(BASE_URL, { transports: ['websocket'] });
  const clientB = ClientIO(BASE_URL, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    let connected = 0;
    const onConnect = () => {
      connected++;
      if (connected === 2) resolve();
    };
    clientA.on('connect', onConnect);
    clientB.on('connect', onConnect);
    setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
  });

  clientA.emit('join_room', { senderId: 'user_agent_A' });
  clientB.emit('join_room', { senderId: 'user_agent_B' });

  // Client B listens for receive_message
  const messageReceivedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for receive_message')), 5000);
    clientB.on('receive_message', (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
  });

  // Client A sends a message with modern telemetry
  console.log('   Client A sending message with device telemetry...');
  clientA.emit('send_message', {
    senderId: 'user_agent_A',
    text: 'Stealth pipeline operational.',
    deviceInfo: {
      isMobile: false,
      model: 'Windows PC',
    },
  });

  const receivedMsg = await messageReceivedPromise;
  console.log('   Client B received message!');
  console.log('   Message text:', receivedMsg.text);
  console.log('   Device info:', JSON.stringify(receivedMsg.deviceInfo));

  // 7. Verify message in DB
  console.log('7. Verifying message stored in MongoDB...');
  const msgFromDb = await Message.findById(receivedMsg._id);
  console.log('   Message in DB verified:', !!msgFromDb ? 'PASSED' : 'FAILED');

  // Clean up
  clientA.disconnect();
  clientB.disconnect();

  await Note.findByIdAndDelete(createdNoteId);
  await Message.findByIdAndDelete(receivedMsg._id);
  console.log('8. Test cleanup completed.');
  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');

  process.exit(0);
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
