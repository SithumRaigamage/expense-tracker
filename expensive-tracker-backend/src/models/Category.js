const mongoose = require('mongoose');
const { CATEGORY_TYPES } = require('../config/constants');
const { ConflictError } = require('../utils/errors');

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
    enum: CATEGORY_TYPES,
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

/**
 * Returns the user's category with this name, creating it if needed. Used for
 * categories the server creates itself ("Transfer Out", "Bills", …).
 *
 * A find-then-create pair races: two first-ever transfers both see no category,
 * both create one, and the unique index rejects the second request. An upsert
 * on exactly the unique-index fields is a single operation, and MongoDB retries
 * it itself if two upserts collide.
 *
 * @param {string} userId
 * @param {{ name: string, type: string, icon?: string, color?: string }} spec
 * @param {{ session?: import('mongoose').ClientSession }} [options]
 */
categorySchema.statics.ensure = async function ensure(userId, { name, type, icon, color }, options = {}) {
  const category = await this.findOneAndUpdate(
    { name, user: userId },
    { $setOnInsert: { type, icon, color, isActive: true } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, ...options }
  );

  if (category.type !== type) {
    const article = /^[aeiou]/i.test(category.type) ? 'An' : 'A';
    throw new ConflictError(`${article} ${category.type} category named "${name}" already exists. Rename it to continue.`);
  }

  return category;
};

module.exports = mongoose.model('Category', categorySchema);
