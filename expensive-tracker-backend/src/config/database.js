const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      logger.error('MONGODB_URI environment variable is not defined');
      logger.info('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/expense-tracker');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error:', { message: error.message, stack: error.stack });
    logger.info('Make sure MongoDB is running and the connection string is correct');
    process.exit(1);
  }
};

module.exports = connectDB;

