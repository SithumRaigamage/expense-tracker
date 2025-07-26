const express = require('express');
const router = express.Router();
const {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletStats,
  bulkDeleteWallets,
  restoreWallet
} = require('../controllers/walletController');

const { protect } = require('../middleware/auth');
const {
  validateWalletCreation,
  validateWalletUpdate,
  validateWalletId
} = require('../validators/walletValidator');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getWallets)
  .post(validateWalletCreation, createWallet);

router.route('/stats')
  .get(getWalletStats);

router.route('/bulk')
  .delete(bulkDeleteWallets);

router.route('/:id')
  .get(validateWalletId, getWallet)
  .put(validateWalletUpdate, updateWallet)
  .delete(validateWalletId, deleteWallet);

router.route('/:id/restore')
  .patch(validateWalletId, restoreWallet);

module.exports = router;