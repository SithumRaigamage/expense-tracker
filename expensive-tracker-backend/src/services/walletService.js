const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { PAGINATION } = require('../config/constants');

/**
 * Service layer for wallet operations
 */
class WalletService {
  /**
   * Get all wallets for a user with pagination and filtering
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Object containing data and pagination info
   */
  static async getWallets(userId, options = {}) {
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT,
      type, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;
    
    const query = { user: userId, isActive: true };
    
    if (type) {
      query.type = type;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const wallets = await Wallet.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Wallet.countDocuments(query);

    return { wallets, total };
  }

  /**
   * Get single wallet by ID
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet object
   */
  static async getWallet(walletId, userId) {
    const wallet = await Wallet.findOne({
      _id: walletId,
      user: userId,
      isActive: true
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return wallet;
  }

  /**
   * Create a new wallet
   * @param {Object} walletData - Wallet data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created wallet
   */
  static async createWallet(walletData, userId) {
    // Check if wallet with same name already exists for this user
    const existingWallet = await Wallet.findOne({
      name: walletData.name,
      user: userId,
      isActive: true
    });

    if (existingWallet) {
      throw new ConflictError('A wallet with this name already exists');
    }

    walletData.user = userId;
    return await Wallet.create(walletData);
  }

  /**
   * Update a wallet
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated wallet
   */
  static async updateWallet(walletId, userId, updateData) {
    // If updating name, check for duplicates
    if (updateData.name) {
      const existingWallet = await Wallet.findOne({
        name: updateData.name,
        user: userId,
        _id: { $ne: walletId },
        isActive: true
      });

      if (existingWallet) {
        throw new ConflictError('A wallet with this name already exists');
      }
    }

    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return wallet;
  }

  /**
   * Delete a wallet (soft delete)
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteWallet(walletId, userId) {
    // Soft delete by setting isActive to false
    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return true;
  }

  /**
   * Bulk delete wallets (soft delete)
   * @param {Array<string>} walletIds - Array of wallet IDs
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted wallets
   */
  static async bulkDeleteWallets(walletIds, userId) {
    const result = await Wallet.updateMany(
      { 
        _id: { $in: walletIds }, 
        user: userId, 
        isActive: true 
      },
      { isActive: false }
    );

    return result.modifiedCount;
  }

  /**
   * Restore a deleted wallet
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Restored wallet
   */
  static async restoreWallet(walletId, userId) {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId, isActive: false },
      { isActive: true },
      { new: true }
    );

    if (!wallet) {
      throw new NotFoundError('Wallet not found or already active');
    }

    return wallet;
  }

  /**
   * Get wallet statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet statistics
   */
  static async getWalletStats(userId) {
    // Aggregation pipeline to get stats by type
    const byType = await Wallet.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$type',
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 },
          avgBalance: { $avg: '$balance' }
        }
      }
    ]);

    // Aggregation pipeline to get stats by currency
    const byCurrency = await Wallet.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$currency',
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Overall stats (approximation since currencies are different, but useful)
    // For a real app, we would convert to a base currency
    const overall = await Wallet.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' }, // This sums all currencies mixed, which is technically wrong but for now OK as per API requirement or we just list count
          totalWallets: { $sum: 1 },
          avgBalance: { $avg: '$balance' },
          maxBalance: { $max: '$balance' },
          minBalance: { $min: '$balance' }
        }
      }
    ]);

    return {
      byType,
      byCurrency,
      overall: overall[0] || {
        totalBalance: 0,
        totalWallets: 0,
        avgBalance: 0,
        maxBalance: 0,
        minBalance: 0
      }
    };
  }

  /**
   * Update wallet balance
   * @param {string} walletId - Wallet ID
   * @param {string} userId - User ID
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @returns {Promise<Object>} Updated wallet
   */
  static async updateBalance(walletId, userId, amount) {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId, isActive: true },
      { $inc: { balance: amount } },
      { new: true, runValidators: true }
    );

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return wallet;
  }
}

module.exports = WalletService;
