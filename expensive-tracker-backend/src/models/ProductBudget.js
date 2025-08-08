const mongoose = require('mongoose');

const productBudgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters long']
    },
    imageUrl: {
      type: String,
      default: ''
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be greater than 0']
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Saved amount cannot be negative']
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual property for progress percentage
productBudgetSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min(Math.round((this.savedAmount / this.targetAmount) * 100), 100);
});

// Add virtual property for remaining amount
productBudgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.savedAmount, 0);
});

// Add index for efficient queries
productBudgetSchema.index({ user: 1, isActive: 1 });

const ProductBudget = mongoose.model('ProductBudget', productBudgetSchema);

module.exports = ProductBudget;
