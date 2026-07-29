const ReleaseNote = require('../models/ReleaseNote');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all release notes
 * @route   GET /api/release-notes
 * @access  Public
 */
const getReleaseNotes = asyncHandler(async (req, res) => {
  const releaseNotes = await ReleaseNote.find({ isPublished: true })
    .sort({ date: -1, version: -1 });
  
  res.status(200).json(releaseNotes);
});

/**
 * @desc    Get release note by version
 * @route   GET /api/release-notes/:version
 * @access  Public
 */
const getReleaseNoteByVersion = asyncHandler(async (req, res) => {
  const releaseNote = await ReleaseNote.findOne({ 
    version: req.params.version,
    isPublished: true
  });
  
  if (!releaseNote) {
    res.status(404);
    throw new Error('Release note not found');
  }
  
  res.status(200).json(releaseNote);
});

/**
 * @desc    Create new release note
 * @route   POST /api/release-notes
 * @access  Private/Admin
 */
const createReleaseNote = asyncHandler(async (req, res) => {
  const { version, date, features, bugfixes, improvements, isPublished } = req.body;
  
  // Check if version already exists
  const existingReleaseNote = await ReleaseNote.findOne({ version });
  if (existingReleaseNote) {
    res.status(400);
    throw new Error('Release note with this version already exists');
  }
  
  const releaseNote = await ReleaseNote.create({
    version,
    date: date || Date.now(),
    features: features || [],
    bugfixes: bugfixes || [],
    improvements: improvements || [],
    isPublished: isPublished !== undefined ? isPublished : true
  });
  
  res.status(201).json(releaseNote);
});

/**
 * @desc    Update release note
 * @route   PUT /api/release-notes/:id
 * @access  Private/Admin
 */
const updateReleaseNote = asyncHandler(async (req, res) => {
  const { version, date, features, bugfixes, improvements, isPublished } = req.body;
  
  const releaseNote = await ReleaseNote.findById(req.params.id);
  
  if (!releaseNote) {
    res.status(404);
    throw new Error('Release note not found');
  }
  
  // If updating version, check if new version already exists (unless it's the same record)
  if (version && version !== releaseNote.version) {
    const existingReleaseNote = await ReleaseNote.findOne({ version });
    if (existingReleaseNote) {
      res.status(400);
      throw new Error('Release note with this version already exists');
    }
  }
  
  releaseNote.version = version || releaseNote.version;
  releaseNote.date = date || releaseNote.date;
  releaseNote.features = features || releaseNote.features;
  releaseNote.bugfixes = bugfixes || releaseNote.bugfixes;
  releaseNote.improvements = improvements || releaseNote.improvements;
  releaseNote.isPublished = isPublished !== undefined ? isPublished : releaseNote.isPublished;
  
  const updatedReleaseNote = await releaseNote.save();
  
  res.status(200).json(updatedReleaseNote);
});

/**
 * @desc    Delete release note
 * @route   DELETE /api/release-notes/:id
 * @access  Private/Admin
 */
const deleteReleaseNote = asyncHandler(async (req, res) => {
  const releaseNote = await ReleaseNote.findById(req.params.id);
  
  if (!releaseNote) {
    res.status(404);
    throw new Error('Release note not found');
  }
  
  await releaseNote.deleteOne();
  
  res.status(200).json({ message: 'Release note removed' });
});

module.exports = {
  getReleaseNotes,
  getReleaseNoteByVersion,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote
};
