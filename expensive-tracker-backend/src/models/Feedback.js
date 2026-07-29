const mongoose = require('mongoose');
const { FEEDBACK_CATEGORIES } = require('../config/constants');

/**
 * A piece of user feedback.
 *
 * The form collected all of this and then dropped it on the floor — submitting
 * logged to the console and reset the fields, so every report a user took the
 * trouble to write was lost.
 */
const feedbackSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: FEEDBACK_CATEGORIES
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [120, 'Title cannot be more than 120 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [4000, 'Description cannot be more than 4000 characters']
  },
  /** 1 (very dissatisfied) to 5 (very satisfied). */
  sentiment: {
    type: Number,
    required: [true, 'Sentiment is required'],
    min: 1,
    max: 5
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  /** Browser and viewport, captured automatically to make bugs reproducible. */
  deviceInfo: {
    type: String,
    trim: true,
    maxlength: [1000, 'Device info cannot be more than 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'triaged', 'resolved'],
    default: 'new'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

feedbackSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
