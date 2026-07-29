const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const { successResponse, createdResponse } = require('../utils/responseFormatter');

/**
 * @desc    Submit feedback
 * @route   POST /api/v1/feedback
 * @access  Private
 */
const createFeedback = asyncHandler(async (req, res) => {
  // Status is triage state, owned by whoever reads the queue — not the sender.
  const { category, title, description, sentiment, rating, deviceInfo } = req.body;

  const feedback = await Feedback.create({
    category, title, description, sentiment, rating, deviceInfo,
    user: req.user.id
  });

  createdResponse(res, feedback, 'Thanks — your feedback has been recorded');
});

/**
 * @desc    List the feedback the signed-in user has sent
 * @route   GET /api/v1/feedback
 * @access  Private
 */
const getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 });
  successResponse(res, feedback);
});

/**
 * @desc    List all feedback
 * @route   GET /api/v1/feedback/all
 * @access  Private/Admin
 */
const getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, feedback);
});

module.exports = { createFeedback, getMyFeedback, getAllFeedback };
