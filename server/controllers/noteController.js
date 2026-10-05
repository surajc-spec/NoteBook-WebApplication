const Note = require('../models/Note');

// @desc    Get all notes
// @route   GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ lastUpdated: -1 });
    res.status(200).json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, error: 'Server Error: Unable to fetch notes' });
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({
      title: title && title.trim() ? title.trim() : 'Untitled Note',
      content: content || '',
      lastUpdated: new Date(),
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, error: 'Server Error: Unable to create note' });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.lastUpdated = new Date();

    await note.save();

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, error: 'Server Error: Unable to update note' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    await note.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, error: 'Server Error: Unable to delete note' });
  }
};
