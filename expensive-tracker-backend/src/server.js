const app = require('./app');
const connectDB = require('./config/database');
const chalk = require('chalk');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// Function to display banner
const displayBanner = () => {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.yellow.bold('                    EXPENSE TRACKER BACKEND                   ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝'));
  console.log(chalk.green('💰 Personal Finance Management API'));
  console.log(chalk.blue('📊 Track expenses, manage categories, and analyze spending'));
  console.log('');
};

// Connect to database
connectDB();

// Display banner
displayBanner();

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health Check: http://localhost:${PORT}/health`);
  
  // Also log to console with colors for development
  if (process.env.NODE_ENV !== 'production') {
    console.log(chalk.green.bold(`🚀 Server is running on port ${PORT}`));
    console.log(chalk.blue(`📊 Environment: ${process.env.NODE_ENV || 'development'}`));
    console.log(chalk.yellow(`💡 Health Check: http://localhost:${PORT}/health`));
    console.log('');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection. Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception. Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = server;
