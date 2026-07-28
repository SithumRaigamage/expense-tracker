const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getMyFeedback,
  getAllFeedback
} = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateFeedbackCreate } = require('../validators/feedbackValidator');

router.use(protect);

// Must come before any /:id route if one is added later.
router.get('/all', adminOnly, getAllFeedback);

router.route('/')
  .get(getMyFeedback)
  .post(validateFeedbackCreate, createFeedback);

module.exports = router;
