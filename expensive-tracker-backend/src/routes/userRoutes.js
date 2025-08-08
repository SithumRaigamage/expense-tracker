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
const {
  uploadProfileImage,
  deleteProfileImage
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const fileUpload = require('../middleware/fileUpload');

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

// Profile image routes
router.route('/profile/image')
  .post(fileUpload.single('profileImage'), uploadProfileImage)
  .delete(deleteProfileImage);

module.exports = router;
