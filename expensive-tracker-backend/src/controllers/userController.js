const asyncHandler = require('express-async-handler');
const UserService = require('../services/userService');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const { BadRequestError } = require('../utils/errors');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/users/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation (Service handles deeper validation)
  if (!name || !email || !password) {
    throw new BadRequestError('Please provide name, email and password');
  }

  const result = await UserService.register(req.body);

  createdResponse(res, result);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/users/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const result = await UserService.login(email, password);

  successResponse(res, result, 200);
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/users/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // Optional: Implement token blacklisting here
  
  successResponse(res, {}, 200, 'Successfully logged out');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await UserService.getProfile(req.user.id);

  successResponse(res, user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await UserService.updateProfile(req.user.id, req.body);

  successResponse(res, user);
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/users/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Please provide current password and new password');
  }

  await UserService.changePassword(req.user.id, currentPassword, newPassword);

  successResponse(res, {}, 200, 'Password updated successfully');
});

/**
 * @desc    Verify token
 * @route   GET /api/v1/users/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  const result = await UserService.verifyToken(req.user.id);

  successResponse(res, result);
});

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken
};