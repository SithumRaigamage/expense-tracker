const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Fail fast on a missing/placeholder JWT secret rather than signing tokens with
// `undefined` at runtime or shipping the example secret to production.
require('./config/validateEnv')();

// Import routes
const expenseRoutes = require('./routes/expenseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const productBudgetRoutes = require('./routes/productBudgetRoutes');
const releaseNoteRoutes = require('./routes/releaseNoteRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const billRoutes = require('./routes/billRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { sanitizeInput } = require('./middleware/validation');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Environment-based
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:3000').split(',') 
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// The session token arrives as an httpOnly cookie; protect reads it from here.
app.use(cookieParser());

// Strip Mongo operators ($gt, $ne, dotted paths) from user input. Without this a
// request body like {"email": {"$gt": ""}} reaches the query layer as an operator.
app.use(mongoSanitize({
  onSanitize: ({ req, key }) => {
    logger.warn('Sanitized prohibited characters from request', {
      key,
      url: req.originalUrl,
      ip: req.ip
    });
  }
}));

// Input sanitization middleware
app.use(sanitizeInput);

// Rate limiting (auth endpoints are limited separately inside their router)
app.use('/api', apiLimiter);

// Set static folder for file uploads
const path = require('path');
// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// Import custom CORS middleware for images
const imageCORSMiddleware = require('./middleware/imageCORS');

// Apply the CORS middleware specifically for the uploads directory
app.use('/uploads', imageCORSMiddleware);
app.use('/uploads', express.static(uploadDir, {
  setHeaders: function (res, path) {
    // Set additional headers for all image files
    if (path.match(/\.(jpg|jpeg|png|gif)$/i)) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
logger.info(`Static file serving set up for: ${uploadDir} with CORS support`);

// Routes
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/productbudgets', productBudgetRoutes);
app.use('/api/v1/release-notes', releaseNoteRoutes);
app.use('/api/v1/currency', currencyRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API health check endpoint (for CORS validation)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
