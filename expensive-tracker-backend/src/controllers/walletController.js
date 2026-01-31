const asyncHandler = require('express-async-handler');
const WalletService = require('../services/walletService');
const { successResponse, createdResponse } = require('../utils/responseFormatter');

/**
 * @desc    Get all wallets for user
 * @route   GET /api/v1/wallets
 * @access  Private
 */
const getWallets = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    type: req.query.type,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder
  };

  const result = await WalletService.getWallets(req.user.id, options);

  // Use manual pagination response since the service returns { wallets, total }
  // instead of just an array
  res.status(200).json({
    success: true,
    count: result.wallets.length,
    total: result.total,
    pagination: {
      page: parseInt(options.page) || 1,
      limit: parseInt(options.limit) || 10,
      pages: Math.ceil(result.total / (parseInt(options.limit) || 10))
    },
    data: result.wallets
  });
});

/**
 * @desc    Get single wallet
 * @route   GET /api/v1/wallets/:id
 * @access  Private
 */
const getWallet = asyncHandler(async (req, res) => {
  const wallet = await WalletService.getWallet(req.params.id, req.user.id);
  
  successResponse(res, wallet);
});

/**
 * @desc    Create new wallet
 * @route   POST /api/v1/wallets
 * @access  Private
 */
const createWallet = asyncHandler(async (req, res) => {
  const wallet = await WalletService.createWallet(req.body, req.user.id);
  
  createdResponse(res, wallet, 'Wallet created successfully');
});

/**
 * @desc    Update wallet
 * @route   PUT /api/v1/wallets/:id
 * @access  Private
 */
const updateWallet = asyncHandler(async (req, res) => {
  const wallet = await WalletService.updateWallet(
    req.params.id,
    req.user.id,
    req.body
  );
  
  successResponse(res, wallet, 200, 'Wallet updated successfully');
});

/**
 * @desc    Delete wallet (soft delete)
 * @route   DELETE /api/v1/wallets/:id
 * @access  Private
 */
const deleteWallet = asyncHandler(async (req, res) => {
  await WalletService.deleteWallet(req.params.id, req.user.id);
  
  successResponse(res, {}, 200, 'Wallet deleted successfully');
});

/**
 * @desc    Bulk delete wallets (soft delete)
 * @route   DELETE /api/v1/wallets/bulk
 * @access  Private
 */
const bulkDeleteWallets = asyncHandler(async (req, res) => {
  const { walletIds } = req.body;
  
  if (!walletIds || !Array.isArray(walletIds) || walletIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an array of wallet IDs to delete'
    });
  }

  const deletedCount = await WalletService.bulkDeleteWallets(walletIds, req.user.id);
  
  successResponse(res, {
    deletedCount,
    requestedCount: walletIds.length
  }, 200, `${deletedCount} wallets deleted successfully`);
});

/**
 * @desc    Restore deleted wallet
 * @route   PATCH /api/v1/wallets/:id/restore
 * @access  Private
 */
const restoreWallet = asyncHandler(async (req, res) => {
  const wallet = await WalletService.restoreWallet(req.params.id, req.user.id);
  
  successResponse(res, wallet, 200, 'Wallet restored successfully');
});

/**
 * @desc    Get wallet statistics
 * @route   GET /api/v1/wallets/stats
 * @access  Private
 */
const getWalletStats = asyncHandler(async (req, res) => {
  const stats = await WalletService.getWalletStats(req.user.id);
  
  successResponse(res, stats);
});

/**
 * @desc    Transfer funds between wallets
 * @route   POST /api/v1/wallets/transfer
 * @access  Private
 */
const transferFunds = asyncHandler(async (req, res) => {
  const result = await WalletService.transferFunds(req.user.id, req.body);
  
  successResponse(res, result, 200, 'Funds transferred successfully');
});

/**
 * @desc    Get expense breakdown flow
 * @route   GET /api/v1/wallets/flow
 * @access  Private
 */
const getExpenseFlow = asyncHandler(async (req, res) => {
  const result = await WalletService.getExpenseFlow(req.user.id);
  
  successResponse(res, result);
});

module.exports = {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  bulkDeleteWallets,
  restoreWallet,
  getWalletStats,
  transferFunds,
  getExpenseFlow
};
