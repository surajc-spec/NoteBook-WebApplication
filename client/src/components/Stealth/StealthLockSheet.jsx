import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Delete } from 'lucide-react';

export default function StealthLockSheet({ isOpen, onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  // Reset PIN on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      // Auto focus hidden or virtual input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Global keyboard listener when lock sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Handle numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitInput(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  const handleDigitInput = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      // Once 4 digits are entered, validate immediately
      if (nextPin.length === 4) {
        if (nextPin === '9988') {
          // Success: Transition into private chat
          setTimeout(() => {
            onSuccess();
          }, 150);
        } else {
          // Wrong PIN: Vanish instantly without error to maintain decoy discretion
          onClose();
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        // If clicking outside the card, vanish discretely
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-sm mx-4 bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl shadow-black/80 flex flex-col items-center">
        {/* Discrete "Syncing Workspace..." Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          <h2 className="text-base font-medium text-slate-200 tracking-wide">
            Syncing Workspace...
          </h2>
        </div>

        <p className="text-xs text-slate-500 text-center mb-6">
          Verifying security token and workspace encryption index
        </p>

        {/* 4-Digit Indicator Dots */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  filled
                    ? 'bg-indigo-400 scale-110 shadow-sm shadow-indigo-400/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Keypad for Mobile and Mouse interactions */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitInput(String(num))}
              className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 text-lg font-medium text-slate-100 transition-colors flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Cancel button disguised as dismiss */}
          <button
            type="button"
            onClick={onClose}
            className="h-14 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
          >
            Cancel
          </button>

          {/* '0' Button */}
          <button
            type="button"
            onClick={() => handleDigitInput('0')}
            className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 text-lg font-medium text-slate-100 transition-colors flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-14 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden input to facilitate mobile software keyboards */}
        <input
          ref={inputRef}
          type="tel"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            if (val.length <= 4) {
              setPin(val);
              if (val.length === 4) {
                if (val === '9988') {
                  setTimeout(onSuccess, 150);
                } else {
                  onClose();
                }
              }
            }
          }}
          className="opacity-0 absolute -z-10 w-0 h-0 pointer-events-none"
        />
      </div>
    </div>
  );
}
