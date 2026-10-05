import React, { useRef, useState } from 'react';
import { Plus, Search, Trash2, FileText, ChevronRight, Menu, X } from 'lucide-react';

export default function NoteSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onStealthTrigger,
  isMobileOpen,
  onToggleMobile,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const tapTimesRef = useRef([]);

  // Mobile/Desktop 5-tap gesture detector: 5 rapid taps within 2.0s
  const handleTitleTap = (e) => {
    const now = Date.now();
    // Keep only timestamps within the last 2000ms
    const recentTaps = tapTimesRef.current.filter((t) => now - t <= 2000);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps;

    if (recentTaps.length >= 5) {
      tapTimesRef.current = [];
      if (onStealthTrigger) {
        onStealthTrigger();
      }
    }
  };

  const filteredNotes = notes.filter((n) =>
    (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNoteDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Title & Tap Trigger */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={handleTitleTap}
            className="cursor-pointer select-none group flex items-center space-x-2 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
            title="Click to select"
          >
            <span className="text-xl">📝</span>
            <div>
              <h1 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-1.5">
                My Notebook
                <span className="opacity-0 group-hover:opacity-40 text-[10px] text-slate-400 transition-opacity">
                  •
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Personal Notes & Thoughts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCreateNote}
              className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Add New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMobile}
              className="p-1.5 text-slate-400 hover:text-slate-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {searchTerm ? 'No matching notes found' : 'No notes yet. Click + to create one!'}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note._id === activeNoteId;
              const preview = (note.content || '')
                .replace(/[#*`_~-]/g, '')
                .trim()
                .slice(0, 60);

              return (
                <div
                  key={note._id}
                  onClick={() => onSelectNote(note._id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-150 flex items-start justify-between border ${
                    isActive
                      ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-sm'
                      : 'border-transparent hover:bg-slate-800/40 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-medium truncate mb-1 text-slate-100">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {preview || 'Empty note...'}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">
                      {formatNoteDate(note.lastUpdated || note.updatedAt)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
          <span>Markdown Supported</span>
        </div>
      </aside>
    </>
  );
}
