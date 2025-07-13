const express = require('express');
const router = express.Router();
const {
  getWallets,
  getWallet,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletStats
} = require('../controllers/walletController');

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getWallets)
  .post(createWallet);

router.route('/stats')
  .get(getWalletStats);

router.route('/:id')
  .get(getWallet)
  .put(updateWallet)
  .delete(deleteWallet);

module.exports = router;