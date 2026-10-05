# Personal Notebook

A modern, distraction-free markdown note-taking web application built with the MERN stack. Designed for developers, writers, and thinkers who need a clean, responsive workspace for daily journaling, project roadmaps, and structured notes.

---

## ✨ Features

- **Distraction-Free Markdown Editor**: Clean interface focusing purely on writing and thoughts.
- **Live Markdown Preview**: Toggle seamlessly between editing mode and formatted preview with support for headings, bold/italics, code snippets, lists, and quotes.
- **Real-Time Cloud Synchronization**: Automatically syncs notes and workspace state with MongoDB.
- **Search & Quick Navigation**: Filter through your notebook collection instantly.
- **Responsive Design**: Optimized for desktop, tablet, and mobile layouts.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas
- **Real-Time Engine**: Socket.io (workspace sync pipeline)

---

## 📁 Project Structure

```
NoteBook-WebApplication/
├── client/                   # React frontend application
│   ├── src/
│   │   ├── components/       # Notebook workspace UI components
│   │   ├── utils/            # Client sync and API utilities
│   │   ├── App.jsx           # Application shell
│   │   └── main.jsx
│   ├── vite.config.js        # Vite configuration & proxy
│   └── package.json
├── server/                   # Express backend API service
│   ├── config/               # Database connection configuration
│   ├── controllers/          # API route controllers
│   ├── models/               # Mongoose data schemas
│   ├── routes/               # API endpoints
│   ├── sockets/              # Workspace sync socket handler
│   ├── server.js             # Server entry point
│   └── package.json
├── render.yaml               # Cloud deployment configuration
├── vercel.json               # Frontend deployment configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string or local MongoDB instance

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_uri
   CLIENT_URL=http://localhost:5173
   ```

3. **Start the Application**:
   ```bash
   # Run backend (from server directory)
   npm start

   # Run frontend (from client directory in a separate terminal)
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment Guide

### Deploying Backend to Render
1. Create a new **Web Service** on Render connected to this repository.
2. Set Root Directory to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add your `MONGODB_URI` environment variable.

### Deploying Frontend to Vercel
1. Import this repository on Vercel.
2. Set Root Directory to `client`.
3. Add the environment variable `VITE_BACKEND_URL` pointing to your Render backend URL.
4. Deploy!
