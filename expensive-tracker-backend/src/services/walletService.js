const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const CurrencyService = require('./currencyService');
const User = require('../models/User');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
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

    // Get user's primary currency
    const user = await User.findById(userId);
    const primaryCurrency = user?.currency || 'LKR';

    // Add converted balances
    const walletsWithConversion = await Promise.all(wallets.map(async (wallet) => {
      const walletObj = wallet.toObject();
      if (wallet.currency !== primaryCurrency) {
        walletObj.convertedBalance = await CurrencyService.convert(
          wallet.balance,
          wallet.currency,
          primaryCurrency
        );
      } else {
        walletObj.convertedBalance = wallet.balance;
      }
      walletObj.primaryCurrency = primaryCurrency;
      return walletObj;
    }));

    return { wallets: walletsWithConversion, total, primaryCurrency };
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
    const user = await User.findById(userId);
    const primaryCurrency = user?.currency || 'LKR';
    const wallets = await Wallet.find({ user: userId, isActive: true });

    const stats = {
      byType: {},
      byCurrency: {},
      overall: {
        totalBalance: 0,
        totalWallets: wallets.length,
        avgBalance: 0,
        maxBalance: 0,
        minBalance: wallets.length > 0 ? Infinity : 0
      }
    };

    for (const wallet of wallets) {
      const convertedBalance = await CurrencyService.convert(
        wallet.balance,
        wallet.currency,
        primaryCurrency
      );

      // Aggregate by type
      if (!stats.byType[wallet.type]) {
        stats.byType[wallet.type] = {
          _id: wallet.type,
          totalBalance: 0,
          count: 0
        };
      }
      stats.byType[wallet.type].totalBalance += convertedBalance;
      stats.byType[wallet.type].count += 1;

      // Aggregate by currency
      if (!stats.byCurrency[wallet.currency]) {
        stats.byCurrency[wallet.currency] = {
          _id: wallet.currency,
          totalBalance: 0,
          count: 0
        };
      }
      stats.byCurrency[wallet.currency].totalBalance += wallet.balance; // Native balance
      stats.byCurrency[wallet.currency].count += 1;

      // Overall stats
      stats.overall.totalBalance += convertedBalance;
      if (convertedBalance > stats.overall.maxBalance) {
        stats.overall.maxBalance = convertedBalance;
      }
      if (convertedBalance < stats.overall.minBalance) {
        stats.overall.minBalance = convertedBalance;
      }
    }

    if (wallets.length > 0) {
      stats.overall.avgBalance = stats.overall.totalBalance / wallets.length;
      if (stats.overall.minBalance === Infinity) stats.overall.minBalance = 0;
    }

    return {
      byType: Object.values(stats.byType),
      byCurrency: Object.values(stats.byCurrency),
      overall: stats.overall,
      primaryCurrency
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

  /**
   * Transfer funds between wallets
   * @param {string} userId - User ID
   * @param {Object} transferData - Transfer data (fromWalletId, toWalletId, amount, description)
   * @returns {Promise<Object>} Object containing the two transaction records
   */
  static async transferFunds(userId, transferData) {
    const { fromWalletId, toWalletId, amount, description } = transferData;

    if (fromWalletId === toWalletId) {
      throw new BadRequestError('Source and destination wallets must be different');
    }

    if (amount <= 0) {
      throw new BadRequestError('Transfer amount must be greater than zero');
    }

    let session = null;
    try {
      session = await mongoose.startSession();
      await session.startTransaction();
      // Standalone MongoDB will throw "Transaction numbers are only allowed on a replica set..." 
      // when we attempt the first command with a transaction
      await mongoose.connection.db.command({ ping: 1 }, { session });
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (e) {
          // Ignore abort errors
        }
        await session.endSession();
      }
      session = null;
    }

    const sessionOptions = session ? { session } : {};

    try {
      // 1. Verify wallets exist and belong to user
      const fromWallet = await Wallet.findOne({ _id: fromWalletId, user: userId, isActive: true }, null, sessionOptions);
      const toWallet = await Wallet.findOne({ _id: toWalletId, user: userId, isActive: true }, null, sessionOptions);

      if (!fromWallet) throw new NotFoundError('Source wallet not found');
      if (!toWallet) throw new NotFoundError('Destination wallet not found');

      // 2. Ensure "Transfer" categories exist
      let transferOutCat = await Category.findOne({ user: userId, name: 'Transfer Out', type: 'expense' }, null, sessionOptions);
      if (!transferOutCat) {
        const catArray = await Category.create([{
          user: userId,
          name: 'Transfer Out',
          type: 'expense',
          icon: '📤',
          color: '#f44336'
        }], sessionOptions);
        transferOutCat = catArray[0];
      }

      let transferInCat = await Category.findOne({ user: userId, name: 'Transfer In', type: 'income' }, null, sessionOptions);
      if (!transferInCat) {
        const catArray = await Category.create([{
          user: userId,
          name: 'Transfer In',
          type: 'income',
          icon: '📥',
          color: '#4caf50'
        }], sessionOptions);
        transferInCat = catArray[0];
      }

      // 3. Create transactions
      const Expense = mongoose.model('Expense');
      
      const outTransactionArray = await Expense.create([{
        title: `Transfer to ${toWallet.name}`,
        amount,
        description: description || `Transfer to ${toWallet.name}`,
        category: transferOutCat._id,
        wallet: fromWalletId,
        user: userId,
        date: new Date()
      }], sessionOptions);

      const inTransactionArray = await Expense.create([{
        title: `Transfer from ${fromWallet.name}`,
        amount,
        description: description || `Transfer from ${fromWallet.name}`,
        category: transferInCat._id,
        wallet: toWalletId,
        user: userId,
        date: new Date()
      }], sessionOptions);

      // 4. Update balances
      fromWallet.balance -= amount;
      toWallet.balance += amount;

      await fromWallet.save(sessionOptions);
      await toWallet.save(sessionOptions);

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        outTransaction: outTransactionArray[0],
        inTransaction: inTransactionArray[0],
        fromWalletBalance: fromWallet.balance,
        toWalletBalance: toWallet.balance
      };
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (e) {
          // Ignore abort errors
        }
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * Get expense breakdown flow (wallets to categories)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Flow data
   */
  static async getExpenseFlow(userId) {
    const Expense = mongoose.model('Expense');
    
    // Aggregate expenses by wallet and category (only for expenses, not transfers)
    const flows = await Expense.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId)
        } 
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      { $match: { 'categoryInfo.type': 'expense' } }, // Only expense flows
      {
        $group: {
          _id: { wallet: '$wallet', category: '$category' },
          amount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'wallets',
          localField: '_id.wallet',
          foreignField: '_id',
          as: 'walletInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$walletInfo' },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          _id: 0,
          source: '$walletInfo.name',
          sourceId: '$_id.wallet',
          target: '$categoryInfo.name',
          targetId: '$_id.category',
          value: '$amount',
          color: '$categoryInfo.color'
        }
      }
    ]);

    const wallets = await Wallet.find({ user: userId, isActive: true });
    const categories = await Category.find({ user: userId, isActive: true, type: 'expense' });

    return {
      links: flows,
      nodes: [
        ...wallets.map(w => ({ id: w._id.toString(), name: w.name, type: 'wallet', color: '#6366f1' })),
        ...categories.map(c => ({ id: c._id.toString(), name: c.name, type: 'category', color: c.color }))
      ]
    };
  }
}

module.exports = WalletService;
