const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  changeEmail,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} = require('../controllers/userController');
const {
  uploadProfileImage,
  deleteProfileImage
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const fileUpload = require('../middleware/fileUpload');
const { singleImage } = require('../middleware/fileUpload');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validatePasswordChange
} = require('../middleware/authValidators');

// Public routes — rate limited and strictly validated: these are the only
// endpoints an unauthenticated caller can reach.
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.use(protect); // Apply auth middleware to all routes below

router.post('/logout', logout);
router.get('/verify', verifyToken);
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);
router.put('/change-email', changeEmail);
router.route('/payment-methods')
  .get(getPaymentMethods)
  .post(addPaymentMethod);
router.route('/payment-methods/:id')
  .put(updatePaymentMethod)
  .delete(deletePaymentMethod);

// Profile image routes
router.route('/profile/image')
  .post(singleImage(fileUpload, 'profileImage'), uploadProfileImage)
  .delete(deleteProfileImage);

module.exports = router;
