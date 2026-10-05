import React from 'react';

export default function MessageBubble({ message, isOwnMessage }) {
  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (

    <div
      className={`flex flex-col mb-4 ${
        isOwnMessage ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender indicator if peer */}
      {!isOwnMessage && (
        <span className="text-[11px] font-semibold text-indigo-400 mb-1 ml-1 tracking-wide">
          Peer
        </span>
      )}

      {/* Chat Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
          isOwnMessage
            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-950/40'
            : 'bg-slate-800 border border-slate-700/70 text-slate-100 rounded-bl-none shadow-black/40'
        }`}
      >
        {message.text}
      </div>

      {/* Message Timestamp (Device telemetry hidden from frontend display) */}
      <div
        className={`flex items-center mt-1 px-1 text-[11px] tracking-tight text-slate-500 font-mono ${
          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}

