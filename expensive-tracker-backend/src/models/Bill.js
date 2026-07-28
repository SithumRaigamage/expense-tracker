const mongoose = require('mongoose');
const { BILL_CATEGORIES } = require('../config/constants');

/**
 * A recurring or one-off bill the user expects to pay.
 *
 * `status` is deliberately not stored. It is a pure function of `dueDate` and
 * `paidAt`, so persisting it means every document goes stale at midnight and
 * something has to sweep the collection to fix them. The virtual below derives
 * it on read instead.
 */
const billSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bill name is required'],
    trim: true,
    maxlength: [80, 'Bill name cannot be more than 80 characters']
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    trim: true,
    maxlength: [80, 'Provider cannot be more than 80 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: BILL_CATEGORIES
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  iconUrl: {
    type: String,
    default: '',
    trim: true
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  reminderSet: {
    type: Boolean,
    default: false
  },
  /** Wallet to draw from when the bill is paid. */
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  lastPaidDate: {
    type: Date,
    default: null
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

billSchema.virtual('status').get(function () {
  if (this.paidAt) {
    return 'Paid';
  }

  const due = startOfDay(this.dueDate).getTime();
  const today = startOfDay(new Date()).getTime();

  if (due < today) return 'Overdue';
  if (due === today) return 'Due Today';
  return 'Upcoming';
});

// The list view is always "this user's active bills, soonest first".
billSchema.index({ user: 1, isActive: 1, dueDate: 1 });

module.exports = mongoose.model('Bill', billSchema);
