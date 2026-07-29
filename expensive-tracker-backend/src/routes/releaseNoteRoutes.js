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
const { validateObjectId } = require('../middleware/validation');
const { validateReleaseNoteCreate, validateReleaseNoteUpdate } = require('../validators/releaseNoteValidator');

// Public routes
router.get('/', getReleaseNotes);
router.get('/:version', getReleaseNoteByVersion);

// Admin routes - protected with authentication and admin role check
router.post('/', protect, adminOnly, validateReleaseNoteCreate, createReleaseNote);
router.put('/:id', protect, adminOnly, validateObjectId(), validateReleaseNoteUpdate, updateReleaseNote);
router.delete('/:id', protect, adminOnly, validateObjectId(), deleteReleaseNote);

module.exports = router;
