const mongoose = require('mongoose');
const { PAYMENT_METHODS, RECURRING_FREQUENCIES } = require('../config/constants');
const { getNextRunDate } = require('../utils/recurrence');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: [true, 'Wallet is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS,
    default: 'cash'
  },
  receipt: {
    type: String, // URL to receipt image
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: RECURRING_FREQUENCIES,
    default: null
  },
  // Next date on which a recurring template should auto-generate an occurrence.
  // Only meaningful when isRecurring is true; maintained by the recurring engine.
  nextRunDate: {
    type: Date,
    default: null
  },
  // Links an auto-generated occurrence back to the recurring template it came from.
  parentExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  }
}, {
  timestamps: true
});

// Keep nextRunDate consistent with the recurring flag.
// - When a template is recurring and has no scheduled next run, seed it from the
//   current date so the engine knows when the first auto-occurrence is due.
// - When an expense is not recurring (including generated occurrences), clear it.
// Note: findOneAndUpdate bypasses this hook, so the recurring engine also
// self-heals a missing nextRunDate at run time.
expenseSchema.pre('save', function seedNextRunDate(next) {
  if (this.isRecurring && this.recurringFrequency) {
    if (!this.nextRunDate) {
      this.nextRunDate = getNextRunDate(this.date, this.recurringFrequency);
    }
  } else {
    this.nextRunDate = null;
  }
  next();
});

// Index for better query performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
// Fast lookup of templates due for generation.
expenseSchema.index({ isRecurring: 1, nextRunDate: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
