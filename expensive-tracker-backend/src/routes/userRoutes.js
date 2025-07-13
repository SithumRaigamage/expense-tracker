const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect); // Apply auth middleware to all routes below

router.post('/logout', logout);
router.get('/verify', verifyToken);
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
