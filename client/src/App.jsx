import React, { useState, useEffect, useCallback, Component } from 'react';
import Notebook from './components/Notebook/Notebook';
import StealthLockSheet from './components/Stealth/StealthLockSheet';
import PrivateChat from './components/Chat/PrivateChat';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-4">{this.state.error?.message || 'Unexpected error'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Application modes: 'NOTEBOOK' | 'CHAT'
  const [appMode, setAppMode] = useState('NOTEBOOK');
  const [isLockSheetOpen, setIsLockSheetOpen] = useState(false);
  const [senderId, setSenderId] = useState('');

  // Initialize or retrieve consistent anonymous sender ID
  useEffect(() => {
    let id = localStorage.getItem('stealth_chat_sender_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('stealth_chat_sender_id', id);
    }
    setSenderId(id);
  }, []);

  // Panic Exit action: instantly force lock state & snap back to Notebook
  const handlePanicExit = useCallback(() => {
    setIsLockSheetOpen(false);
    setAppMode('NOTEBOOK');
  }, []);

  // Global keyboard shortcut listener for 'Ctrl + Shift + Z'
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Check for Ctrl + Shift + Z (both upper and lower case Z)
      if (e.ctrlKey && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        e.preventDefault();

        if (appMode === 'CHAT') {
          // Inside chat: instantly panic exit back to notebook
          handlePanicExit();
        } else if (appMode === 'NOTEBOOK') {
          // Inside notebook: open discrete lock sheet
          setIsLockSheetOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [appMode, handlePanicExit]);

  // Mobile 5-tap title trigger handler
  const handleStealthTrigger = () => {
    if (appMode === 'NOTEBOOK') {
      setIsLockSheetOpen(true);
    }
  };

  // Lock sheet success: PIN "9988" entered
  const handleUnlockChat = () => {
    setIsLockSheetOpen(false);
    setAppMode('CHAT');
  };

  // Lock sheet dismiss (wrong PIN or cancel)
  const handleCloseLockSheet = () => {
    setIsLockSheetOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {appMode === 'NOTEBOOK' ? (
          <Notebook onStealthTrigger={handleStealthTrigger} />
        ) : (
          <PrivateChat senderId={senderId} onPanicExit={handlePanicExit} />
        )}

        {/* Discrete Stealth Lock Sheet */}
        <StealthLockSheet
          isOpen={isLockSheetOpen}
          onSuccess={handleUnlockChat}
          onClose={handleCloseLockSheet}
        />
      </div>
    </ErrorBoundary>
  );
}

