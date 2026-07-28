const express = require('express');
const router = express.Router();
const { getStatus, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/status', getStatus);

// Every message costs money, so this endpoint gets a tighter budget than the
// general API limiter.
router.post('/', chatLimiter, sendMessage);

module.exports = router;
