const app = require('./app');
const connectDB = require('./config/database');
const chalk = require('chalk');

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
  console.log(chalk.green.bold(`🚀 Server is running on port ${PORT}`));
  console.log(chalk.blue(`📊 Environment: ${process.env.NODE_ENV || 'development'}`));
  console.log(chalk.yellow(`💡 Health Check: http://localhost:${PORT}/health`));
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection. Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception. Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = server;
