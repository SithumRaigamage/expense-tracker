const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Import routes
const expenseRoutes = require('./routes/expenseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const productBudgetRoutes = require('./routes/productBudgetRoutes');
const releaseNoteRoutes = require('./routes/releaseNoteRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const importRoutes = require('./routes/importRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { sanitizeInput } = require('./middleware/validation');

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

// Input sanitization middleware
app.use(sanitizeInput);

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
app.use('/api/v1/imports', importRoutes);

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
