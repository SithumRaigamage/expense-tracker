const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createDefaultCategories
} = require('../controllers/categoryController');

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.post('/defaults', createDefaultCategories);

// Main CRUD routes
router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
