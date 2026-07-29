const express = require('express');
const router = express.Router();
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  payBill
} = require('../controllers/billController');

const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { validateBillCreate, validateBillUpdate } = require('../validators/billValidator');

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .get(getBills)
  .post(validateBillCreate, createBill);

router.route('/:id')
  .get(validateObjectId(), getBill)
  .put(validateObjectId(), validateBillUpdate, updateBill)
  .delete(validateObjectId(), deleteBill);

// Paying moves money, so it is its own transactional endpoint.
router.route('/:id/pay')
  .post(validateObjectId(), payBill);

module.exports = router;
