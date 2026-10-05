import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Code,
  Heading,
  List,
  Quote,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  Menu,
} from 'lucide-react';

export default function NoteEditor({
  note,
  onUpdateNote,
  saveStatus,
  onOpenMobileSidebar,
  onStealthTrigger,
}) {
  const [isPreview, setIsPreview] = useState(false);
  const mobileTapsRef = React.useRef([]);

  const handleMobileMenuTap = (e) => {
    const now = Date.now();
    const recent = mobileTapsRef.current.filter((t) => now - t <= 2000);
    recent.push(now);
    mobileTapsRef.current = recent;

    if (recent.length >= 5) {
      mobileTapsRef.current = [];
      if (onStealthTrigger) onStealthTrigger();
      return;
    }

    if (onOpenMobileSidebar) {
      onOpenMobileSidebar();
    }
  };


  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-4 shadow-inner">
          📓
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-1">No Note Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Select an existing note from the sidebar or click the plus button to create a new thought.
        </p>
      </div>
    );
  }

  const handleTitleChange = (e) => {
    onUpdateNote({ ...note, title: e.target.value });
  };

  const handleContentChange = (e) => {
    onUpdateNote({ ...note, content: e.target.value });
  };

  // Format action helpers for markdown insertion
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('note-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = note.content || '';
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    onUpdateNote({ ...note, content: newContent });

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  // Simple clean markdown preview renderer
  const renderMarkdown = (markdownText = '') => {
    const lines = markdownText.split('\n');
    return lines.map((line, idx) => {
      // Headings
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-slate-100 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-bold text-slate-100 mt-5 mb-2.5">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-extrabold text-slate-100 mt-6 mb-3">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-indigo-500/60 pl-3 py-1 my-2 text-slate-400 italic bg-slate-900/40 rounded-r"
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // List
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-1">
            {formatInline(line.slice(2))}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-4" />;
      }
      // Paragraph
      return (
        <p key={idx} className="text-slate-300 leading-relaxed my-1">
          {formatInline(line)}
        </p>
      );
    });
  };

  // Helper for bold, italic, code
  const formatInline = (text) => {
    // Basic regex replacement for display
    let elements = [text];
    return text;
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Editor Toolbar & Header */}
      <div className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          {/* Mobile menu toggle */}
          <button
            onClick={handleMobileMenuTap}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 lg:hidden"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>


          {/* Quick formatting tools */}
          <div className="hidden sm:flex items-center space-x-1 border-r border-slate-800 pr-3 mr-2">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('`', '`')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Inline Code (`code`)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('### ')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Heading (### )"
            >
              <Heading className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Bullet List (- )"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Quote (> )"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setIsPreview(false)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                !isPreview
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isPreview
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          {saveStatus === 'saving' && (
            <span className="flex items-center text-amber-400/90 gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center text-emerald-400/90 gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          {saveStatus === 'offline' && (
            <span className="text-slate-500">Offline</span>
          )}
        </div>
      </div>

      {/* Editor Content Body */}
      <div className="flex-1 flex flex-col p-6 sm:p-10 max-w-4xl w-full mx-auto overflow-y-auto">
        {/* Title Input */}
        <input
          type="text"
          value={note.title || ''}
          onChange={handleTitleChange}
          placeholder="Note title..."
          className="w-full text-2xl sm:text-3xl font-bold bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none mb-4 pb-2 border-b border-transparent focus:border-slate-800 transition-colors"
        />

        {/* Editor or Preview Pane */}
        {isPreview ? (
          <div className="flex-1 prose prose-invert max-w-none text-slate-300">
            {note.content ? (
              renderMarkdown(note.content)
            ) : (
              <p className="text-slate-600 italic">No content to preview.</p>
            )}
          </div>
        ) : (
          <textarea
            id="note-textarea"
            value={note.content || ''}
            onChange={handleContentChange}
            placeholder="Type your markdown notes here..."
            className="flex-1 w-full bg-transparent text-slate-200 placeholder-slate-600 resize-none focus:outline-none font-mono text-sm leading-relaxed"
          />
        )}
      </div>
    </main>
  );
}
