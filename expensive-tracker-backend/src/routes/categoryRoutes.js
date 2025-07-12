const express = require('express');
const router = express.Router();

// Import controller methods (to be created)
// const {
//   getCategories,
//   getCategory,
//   createCategory,
//   updateCategory,
//   deleteCategory
// } = require('../controllers/categoryController');

// Routes
router.route('/')
  .get((req, res) => res.json({ message: 'Get all categories' }))
  .post((req, res) => res.json({ message: 'Create category' }));

router.route('/:id')
  .get((req, res) => res.json({ message: `Get category ${req.params.id}` }))
  .put((req, res) => res.json({ message: `Update category ${req.params.id}` }))
  .delete((req, res) => res.json({ message: `Delete category ${req.params.id}` }));

module.exports = router;
