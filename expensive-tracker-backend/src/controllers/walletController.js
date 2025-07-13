const Wallet = require('../models/Wallet');

// @desc    Get all wallets for user
// @route   GET /api/v1/wallets
// @access  Private
const getWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wallets.length,
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

    const wallet = await Wallet.create(req.body);

    res.status(201).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update wallet
// @route   PUT /api/v1/wallets/:id
// @access  Private
const updateWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

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

// @desc    Delete wallet (soft delete)
// @route   DELETE /api/v1/wallets/:id
// @access  Private
const deleteWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.status(200).json({
      success: true,
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
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBalance = await Wallet.aggregate([
      { $match: { user: req.user.id, isActive: true } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: stats,
        totalBalance: totalBalance[0]?.total || 0
      }
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
  getWalletStats
};