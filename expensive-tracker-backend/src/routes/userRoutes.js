const express = require('express');
const router = express.Router();

// Import controller methods (to be created)
// const {
//   register,
//   login,
//   logout,
//   getProfile,
//   updateProfile,
//   deleteAccount
// } = require('../controllers/userController');

// Routes
router.post('/register', (req, res) => res.json({ message: 'Register user' }));
router.post('/login', (req, res) => res.json({ message: 'Login user' }));
router.post('/logout', (req, res) => res.json({ message: 'Logout user' }));

router.route('/profile')
  .get((req, res) => res.json({ message: 'Get user profile' }))
  .put((req, res) => res.json({ message: 'Update user profile' }))
  .delete((req, res) => res.json({ message: 'Delete user account' }));

module.exports = router;
