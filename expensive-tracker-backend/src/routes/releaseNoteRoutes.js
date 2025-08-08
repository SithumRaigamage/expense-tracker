const express = require('express');
const router = express.Router();
const {
  getReleaseNotes,
  getReleaseNoteByVersion,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote
} = require('../controllers/releaseNoteController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', getReleaseNotes);
router.get('/:version', getReleaseNoteByVersion);

// Admin routes - protected with authentication and admin role check
router.post('/', protect, adminOnly, createReleaseNote);
router.put('/:id', protect, adminOnly, updateReleaseNote);
router.delete('/:id', protect, adminOnly, deleteReleaseNote);

module.exports = router;
