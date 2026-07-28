const asyncHandler = require('express-async-handler');
const ChatService = require('../services/chatService');
const { successResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * @desc    Report whether the assistant is usable on this deployment
 * @route   GET /api/v1/chat/status
 * @access  Private
 */
const getStatus = asyncHandler(async (req, res) => {
  successResponse(res, {
    available: ChatService.isConfigured(),
    model: ChatService.isConfigured() ? ChatService.MODEL : null
  });
});

/**
 * @desc    Stream an assistant reply grounded in the user's own finances
 * @route   POST /api/v1/chat
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  try {
    await ChatService.streamReply({
      userId: req.user.id,
      messages: req.body.messages,
      res
    });
  } catch (error) {
    // Once the SSE headers are out, the error middleware can't turn this into a
    // JSON error response — the client is already reading an event stream. Send
    // the failure down that stream instead and close it.
    if (res.headersSent) {
      logger.error('Chat stream failed mid-response', { error: error.message });
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'The assistant stopped unexpectedly.' })}\n\n`);
      return res.end();
    }
    throw error;
  }
});

module.exports = { getStatus, sendMessage };
