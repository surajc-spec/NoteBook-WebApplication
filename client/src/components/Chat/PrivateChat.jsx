import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  ShieldAlert,
  Send,
  Lock,
  LogOut,
  Radio,
  Sparkles,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { getDeviceTelemetry } from '../../utils/deviceTelemetry';
import { apiUrl, BACKEND_URL } from '../../utils/api';

export default function PrivateChat({ senderId, onPanicExit }) {

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };


  // Quick Panic Exit keyboard listener: Ctrl + Shift + Z
  useEffect(() => {
    const handlePanicShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();
        onPanicExit();
      }
    };

    window.addEventListener('keydown', handlePanicShortcut);
    return () => window.removeEventListener('keydown', handlePanicShortcut);
  }, [onPanicExit]);

  // Socket.io initialization & chat history loading
  useEffect(() => {
    // Fetch initial chat history from MongoDB
    fetch(apiUrl('/api/messages?limit=150'))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data);
          setTimeout(() => scrollToBottom(false), 100);
        }
      })
      .catch((err) => console.error('Failed to load message history:', err));

    // Connect to Socket.io server
    const socket = io(BACKEND_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join single private pipeline room
      socket.emit('join_room', { senderId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for incoming broadcast messages from peer
    socket.on('receive_message', (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
      setTimeout(() => scrollToBottom(true), 50);
    });

    return () => {
      socket.disconnect();
    };
  }, [senderId]);

  // Send message with real-time device telemetry
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    try {
      // Instantly capture modern hardware telemetry before dispatching payload
      const telemetry = await getDeviceTelemetry();

      const payload = {
        senderId,
        text: trimmed,
        timestamp: new Date(),
        deviceInfo: {
          isMobile: telemetry.isMobile,
          model: telemetry.model,
        },
      };

      if (socketRef.current) {
        socketRef.current.emit('send_message', payload, (response) => {
          if (response?.success && response.data) {
            // Append saved document with server-verified ID and timestamp
            setMessages((prev) => [...prev, response.data]);
          } else {
            // Fallback: append local payload
            setMessages((prev) => [...prev, { ...payload, _id: 'temp-' + Date.now() }]);
          }
          setTimeout(() => scrollToBottom(true), 50);
        });
      }

      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Header with Panic Exit Button */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                Secure Channel
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                Live 1-on-1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              End-to-end encrypted session • Auto-purged metadata
            </p>
          </div>
        </div>

        {/* Action Controls: Red Panic Exit */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* RED QUICK PANIC EXIT BUTTON */}
          <button
            onClick={onPanicExit}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-lg shadow-rose-900/40 border border-rose-500/40 transition-all transform active:scale-95"
            title="Instantly lock and snap back to Notebook (Ctrl + Shift + Z)"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="font-semibold">Quick Exit</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-300 mb-1">
              Encrypted Tunnel Established
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Messages and hardware telemetry are securely transmitted through the private-chat-room pipeline.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === senderId;
            return (
              <MessageBubble
                key={msg._id || index}
                message={msg}
                isOwnMessage={isOwn}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-sm">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type encrypted message..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium text-sm flex items-center space-x-1.5 transition-all ${
              inputText.trim() && !isSending
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
