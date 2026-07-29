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
const { validateObjectId } = require('../middleware/validation');
const { validateCategoryCreate, validateCategoryUpdate } = require('../validators/categoryValidator');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.post('/defaults', createDefaultCategories);

// Main CRUD routes
router.route('/')
  .get(getCategories)
  .post(validateCategoryCreate, createCategory);

router.route('/:id')
  .get(validateObjectId(), getCategory)
  .put(validateObjectId(), validateCategoryUpdate, updateCategory)
  .delete(validateObjectId(), deleteCategory);

module.exports = router;
