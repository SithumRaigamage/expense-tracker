const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense-tracker')
  .then(() => {
    console.log('✅ MongoDB Connected');
    clearCategories();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

async function clearCategories() {
  try {
    // Clear all categories
    const result = await mongoose.connection.db.collection('categories').deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} categories from database`);
    
    console.log('✅ Categories cleared successfully');
    console.log('📝 Please refresh the frontend and create new categories with the updated schema');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing categories:', error);
    process.exit(1);
  }
}
