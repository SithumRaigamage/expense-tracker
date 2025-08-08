const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Wallet name is required'],
    trim: true,
    maxlength: [50, 'Wallet name cannot be more than 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Wallet type is required'],
    enum: ['cash', 'bank', 'credit', 'savings', 'crypto', 'investment', 'loan'],
    default: 'cash'
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    default: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'LKR',
    enum: ['LKR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [30, 'Payment method cannot be more than 30 characters']
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

// Index for better query performance
walletSchema.index({ user: 1 });
walletSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Wallet', walletSchema);