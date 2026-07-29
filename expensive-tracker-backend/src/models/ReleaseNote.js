const mongoose = require('mongoose');

const releaseNoteSchema = new mongoose.Schema({
  version: {
    type: String,
    required: [true, 'Version number is required'],
    trim: true,
    unique: true
  },
  date: {
    type: Date,
    required: [true, 'Release date is required'],
    default: Date.now
  },
  features: [{
    type: String,
    trim: true
  }],
  bugfixes: [{
    type: String,
    trim: true
  }],
  improvements: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReleaseNote', releaseNoteSchema);
