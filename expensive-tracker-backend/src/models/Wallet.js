const mongoose = require('mongoose');
const { WALLET_TYPES, CURRENCIES } = require('../config/constants');

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
    enum: WALLET_TYPES,
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
    enum: CURRENCIES
  },
  /**
   * Savings targets, used by the emergency-fund view. They were hardcoded in
   * the component (100000 and 5000), so every user saw the same goal and could
   * not change it. Optional because they only mean anything for a fund wallet.
   */
  targetAmount: {
    type: Number,
    min: [0, 'Target amount cannot be negative'],
    default: null
  },
  monthlyTarget: {
    type: Number,
    min: [0, 'Monthly target cannot be negative'],
    default: null
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