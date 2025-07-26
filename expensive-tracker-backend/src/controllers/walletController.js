const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

// @desc    Get all wallets for user
// @route   GET /api/v1/wallets
// @access  Private
const getWallets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = { user: req.user.id, isActive: true };
    if (type) {
      filter.type = type;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const wallets = await Wallet.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Wallet.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: wallets.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: wallets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single wallet
// @route   GET /api/v1/wallets/:id
// @access  Private
const getWallet = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID format'
      });
    }

    const wallet = await Wallet.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new wallet
// @route   POST /api/v1/wallets
// @access  Private
const createWallet = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check if wallet with same name already exists for this user
    const existingWallet = await Wallet.findOne({
      name: req.body.name,
      user: req.user.id,
      isActive: true
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        error: 'A wallet with this name already exists'
      });
    }

    const wallet = await Wallet.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: wallet
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Update wallet
// @route   PUT /api/v1/wallets/:id
// @access  Private
const updateWallet = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID format'
      });
    }

    // Check if wallet exists and belongs to user
    const existingWallet = await Wallet.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!existingWallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // If updating name, check for duplicates
    if (req.body.name && req.body.name !== existingWallet.name) {
      const duplicateWallet = await Wallet.findOne({
        name: req.body.name,
        user: req.user.id,
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (duplicateWallet) {
        return res.status(400).json({
          success: false,
          error: 'A wallet with this name already exists'
        });
      }
    }

    // Prevent updating user field
    delete req.body.user;

    const wallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Wallet updated successfully',
      data: wallet
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    next(error);
  }
};

// @desc    Delete wallet (soft delete)
// @route   DELETE /api/v1/wallets/:id
// @access  Private
const deleteWallet = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID format'
      });
    }

    const wallet = await Wallet.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Soft delete by setting isActive to false
    await Wallet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Wallet deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet statistics
// @route   GET /api/v1/wallets/stats
// @access  Private
const getWalletStats = async (req, res, next) => {
  try {
    const stats = await Wallet.aggregate([
      { $match: { user: req.user.id, isActive: true } },
      {
        $group: {
          _id: '$type',
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 },
          avgBalance: { $avg: '$balance' }
        }
      },
      { $sort: { totalBalance: -1 } }
    ]);

    const totalStats = await Wallet.aggregate([
      { $match: { user: req.user.id, isActive: true } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalWallets: { $sum: 1 },
          avgBalance: { $avg: '$balance' },
          maxBalance: { $max: '$balance' },
          minBalance: { $min: '$balance' }
        }
      }
    ]);

    const currencyStats = await Wallet.aggregate([
      { $match: { user: req.user.id, isActive: true } },
      {
        $group: {
          _id: '$currency',
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalBalance: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: stats,
        byCurrency: currencyStats,
        overall: totalStats[0] || {
          totalBalance: 0,
          totalWallets: 0,
          avgBalance: 0,
          maxBalance: 0,
          minBalance: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete wallets (soft delete)
// @route   DELETE /api/v1/wallets/bulk
// @access  Private
const bulkDeleteWallets = async (req, res, next) => {
  try {
    const { walletIds } = req.body;

    if (!walletIds || !Array.isArray(walletIds) || walletIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Wallet IDs array is required'
      });
    }

    // Validate all ObjectIds
    const invalidIds = walletIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID format',
        details: invalidIds
      });
    }

    const result = await Wallet.updateMany(
      {
        _id: { $in: walletIds },
        user: req.user.id,
        isActive: true
      },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} wallets deleted successfully`,
      data: {
        deletedCount: result.modifiedCount,
        requestedCount: walletIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore deleted wallet
// @route   PATCH /api/v1/wallets/:id/restore
// @access  Private
const restoreWallet = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID format'
      });
    }

    const wallet = await Wallet.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: false
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Deleted wallet not found'
      });
    }

    // Check if active wallet with same name exists
    const duplicateWallet = await Wallet.findOne({
      name: wallet.name,
      user: req.user.id,
      isActive: true
    });

    if (duplicateWallet) {
      return res.status(400).json({
        success: false,
        error: 'A wallet with this name already exists. Please rename the existing wallet first.'
      });
    }

    const restoredWallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Wallet restored successfully',
      data: restoredWallet
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletStats,
  bulkDeleteWallets,
  restoreWallet
};