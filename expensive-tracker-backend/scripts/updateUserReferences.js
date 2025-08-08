const mongoose = require('mongoose');
const User = require('../src/models/User');
const Expense = require('../src/models/Expense');
const ProductBudget = require('../src/models/ProductBudget');
const Wallet = require('../src/models/Wallet');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

const updateReferences = async () => {
  try {
    // Get all users
    const users = await User.find();
    
    if (users.length === 0) {
      console.log('No users found in the database. Please run seedUser.js first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users in the database.`);

    // Assign all orphaned records to the first user
    // We'll use the first user as the default owner for all orphaned records
    const defaultUser = users[0];
    console.log(`Using ${defaultUser.name} (${defaultUser.email}) with ID ${defaultUser._id} as the default owner for orphaned records.`);

    // Update Expenses
    const expenseResult = await Expense.updateMany(
      { user: { $exists: true }, $or: [{ user: null }, { user: { $nin: users.map(u => u._id) } }] },
      { $set: { user: defaultUser._id } }
    );
    console.log(`Updated ${expenseResult.modifiedCount} orphaned expenses.`);

    // Update ProductBudgets
    const productBudgetResult = await ProductBudget.updateMany(
      { user: { $exists: true }, $or: [{ user: null }, { user: { $nin: users.map(u => u._id) } }] },
      { $set: { user: defaultUser._id } }
    );
    console.log(`Updated ${productBudgetResult.modifiedCount} orphaned product budgets.`);

    // Update Wallets
    const walletResult = await Wallet.updateMany(
      { user: { $exists: true }, $or: [{ user: null }, { user: { $nin: users.map(u => u._id) } }] },
      { $set: { user: defaultUser._id } }
    );
    console.log(`Updated ${walletResult.modifiedCount} orphaned wallets.`);

    console.log('Update complete. All orphaned records have been reassigned to the default user.');
    
    // Optional: Count of all records by user
    for (const user of users) {
      const expenseCount = await Expense.countDocuments({ user: user._id });
      const productBudgetCount = await ProductBudget.countDocuments({ user: user._id });
      const walletCount = await Wallet.countDocuments({ user: user._id });
      
      console.log(`User ${user.name} (${user.email}) has:`);
      console.log(`- ${expenseCount} expenses`);
      console.log(`- ${productBudgetCount} product budgets`);
      console.log(`- ${walletCount} wallets`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error updating references:', err);
    process.exit(1);
  }
};

updateReferences();
