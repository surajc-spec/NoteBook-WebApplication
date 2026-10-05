import React, { useState, useEffect, useRef } from 'react';
import NoteSidebar from './NoteSidebar';
import NoteEditor from './NoteEditor';
import { apiUrl } from '../../utils/api';

export default function Notebook({ onStealthTrigger }) {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'offline'
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const autoSaveTimerRef = useRef(null);

  // Initial fetch of notes from backend MongoDB
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch(apiUrl('/api/notes'));

      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setNotes(data);
        if (data.length > 0 && !activeNoteId) {
          setActiveNoteId(data[0]._id);
        }
      } else {
        setSaveStatus('offline');
      }
    } catch (err) {
      console.warn('Could not fetch notes from server, running locally:', err);
      // Create a default welcome note in offline mode if empty
      const defaultNote = {
        _id: 'default-1',
        title: 'Welcome to Notebook',
        content: '# Getting Started\n\nWelcome to your private markdown workspace.\n\n- Write daily journals\n- Track todos\n- Capture ideas\n\nEverything stays strictly organized.',
        lastUpdated: new Date().toISOString(),
      };
      setNotes([defaultNote]);
      setActiveNoteId(defaultNote._id);
      setSaveStatus('offline');
    }
  };

  const activeNote = notes.find((n) => n._id === activeNoteId) || null;

  // Handle Note Update with Debounced Autosave to MongoDB
  const handleUpdateNote = (updatedNote) => {
    // Update local state immediately
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n))
    );
    setSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/notes/${updatedNote._id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedNote.title,
            content: updatedNote.content,
          }),
        });
        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('offline');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('offline');
      }
    }, 600);
  };

  // Create New Note
  const handleCreateNote = async () => {
    try {
      setSaveStatus('saving');
      const res = await fetch(apiUrl('/api/notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const newNote = json.data;
        setNotes((prev) => [newNote, ...prev]);
        setActiveNoteId(newNote._id);
        setSaveStatus('saved');
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Fallback local note creation:', err);
      const fallbackNote = {
        _id: 'local-' + Date.now(),
        title: 'Untitled Note',
        content: '',
        lastUpdated: new Date().toISOString(),
      };
      setNotes((prev) => [fallbackNote, ...prev]);
      setActiveNoteId(fallbackNote._id);
      setSaveStatus('offline');
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      await fetch(apiUrl(`/api/notes/${id}`), { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting note:', err);
    }


    setNotes((prev) => {
      const filtered = prev.filter((n) => n._id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(filtered.length > 0 ? filtered[0]._id : null);
      }
      return filtered;
    });
  };

  return (
    <div className="fixed inset-0 flex h-full w-full bg-slate-950 overflow-hidden font-sans text-slate-100">
      <NoteSidebar

        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setIsMobileOpen(false);
        }}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onStealthTrigger={onStealthTrigger}
        isMobileOpen={isMobileOpen}
        onToggleMobile={() => setIsMobileOpen((prev) => !prev)}
      />

      <NoteEditor
        note={activeNote}
        onUpdateNote={handleUpdateNote}
        saveStatus={saveStatus}
        onOpenMobileSidebar={() => setIsMobileOpen(true)}
        onStealthTrigger={onStealthTrigger}
      />
    </div>

  );
}
