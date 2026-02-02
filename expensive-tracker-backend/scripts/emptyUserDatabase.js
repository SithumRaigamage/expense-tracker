const mongoose = require('mongoose');
const User = require('../src/models/User');
const Expense = require('../src/models/Expense');
const Wallet = require('../src/models/Wallet');
const Category = require('../src/models/Category');
const ProductBudget = require('../src/models/ProductBudget');
require('dotenv').config();

const emptyUserDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    const userEmail = 'sraig2002@gmail.com';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ User with email ${userEmail} not found.`);
      return;
    }

    console.log(`👤 Found user: ${user.name} (${user._id})`);

    // Delete related data
    const expensesResult = await Expense.deleteMany({ user: user._id });
    console.log(`🗑️  Deleted ${expensesResult.deletedCount} expenses`);

    const budgetsResult = await ProductBudget.deleteMany({ user: user._id });
    console.log(`🗑️  Deleted ${budgetsResult.deletedCount} product budgets`);

    const walletsResult = await Wallet.deleteMany({ user: user._id });
    console.log(`🗑️  Deleted ${walletsResult.deletedCount} wallets`);

    const categoriesResult = await Category.deleteMany({ user: user._id });
    console.log(`🗑️  Deleted ${categoriesResult.deletedCount} categories`);

    // Delete the user
    const userResult = await User.deleteOne({ _id: user._id });
    console.log(`🗑️  Deleted user account: ${userResult.deletedCount === 1 ? 'Success' : 'Failed'}`);

    console.log('\n🎉 Database cleanup for user completed successfully!');

  } catch (error) {
    console.error('❌ Error emptying database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

emptyUserDatabase();
