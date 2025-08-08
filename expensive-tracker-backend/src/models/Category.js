const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [30, 'Category name cannot be more than 30 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [100, 'Description cannot be more than 100 characters']
  },
  icon: {
    type: String,
    default: '📁'
  },
  color: {
    type: String,
    default: '#6366f1',
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Category type is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure category name is unique per user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
