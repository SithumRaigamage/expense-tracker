const mongoose = require('mongoose');
const User = require('../src/models/User');
const Expense = require('../src/models/Expense');
const Wallet = require('../src/models/Wallet');
const Category = require('../src/models/Category');
const ProductBudget = require('../src/models/ProductBudget');
const ReleaseNote = require('../src/models/ReleaseNote');
require('dotenv').config();

const USERS_TO_SEED = [
  {
    email: 'test123@gmail.com',
    name: 'Test User',
    password: 'password123',
    currency: 'USD',
    role: 'admin'
  },
  {
    email: 'sraig2002@gmail.com',
    name: 'Sithum Raigamage',
    password: 'sithum123',
    currency: 'LKR',
    role: 'admin'
  }
];

// Helper to get random date between date range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or Update Users
    for (const userData of USERS_TO_SEED) {
      console.log(`\n🚀 Seeding data for: ${userData.email}`);
      
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        user = await User.create(userData);
        console.log(`   👤 Created user: ${user.name}`);
      } else {
        console.log(`   👤 Found existing user: ${user.name}`);
        // Ensure user is active so they can login via GUI
        user.isActive = true;
        await user.save();
      }

      // --- 1. Categories ---
      console.log('   📂 Seeding Categories...');
      // Clear existing user data to avoid duplicates/conflicts during re-seeding
      await Category.deleteMany({ user: user._id });
      await Wallet.deleteMany({ user: user._id });
      await Expense.deleteMany({ user: user._id });
      await ProductBudget.deleteMany({ user: user._id });

      const categoryData = [
        { name: 'Food', type: 'expense', color: '#FF5722', icon: '🍔' },
        { name: 'Housing', type: 'expense', color: '#3F51B5', icon: '🏠' },
        { name: 'Transportation', type: 'expense', color: '#009688', icon: '🚗' },
        { name: 'Entertainment', type: 'expense', color: '#9C27B0', icon: '🎬' },
        { name: 'Shopping', type: 'expense', color: '#E91E63', icon: '🛍️' },
        { name: 'Utilities', type: 'expense', color: '#607D8B', icon: '⚡' },
        { name: 'Health', type: 'expense', color: '#F44336', icon: '❤️' },
        { name: 'Travel', type: 'expense', color: '#FF9800', icon: '✈️' },
        { name: 'Education', type: 'expense', color: '#2196F3', icon: '📚' },
        { name: 'Subscribed', type: 'expense', color: '#00BCD4', icon: '📺' },
        { name: 'Insurance', type: 'expense', color: '#795548', icon: '🛡️' },
        { name: 'Salary', type: 'income', color: '#4CAF50', icon: '💰' },
        { name: 'Freelance', type: 'income', color: '#8BC34A', icon: '💻' },
        { name: 'Investments', type: 'income', color: '#CDDC39', icon: '📈' },
        { name: 'Gifts', type: 'income', color: '#FFC107', icon: '🎁' }
      ];

      const categories = {}; // Map name -> doc
      
      for (const cat of categoryData) {
        const createdCat = await Category.create({ ...cat, user: user._id });
        categories[createdCat.name] = createdCat;
      }
      console.log(`      ✅ Created ${categoryData.length} categories`);

      // --- 2. Wallets ---
      console.log('   💰 Seeding Wallets...');
      const walletsData = [
        { name: 'Cash', balance: 15000, type: 'cash', currency: user.currency, user: user._id },
        { name: 'Bank Account', balance: 250000, type: 'bank', currency: user.currency, user: user._id },
        { name: 'Credit Card', balance: -15000, type: 'credit', currency: user.currency, user: user._id },
        { name: 'Savings Account', balance: 750000, type: 'savings', currency: user.currency, user: user._id },
        { name: 'Investment Wallet', balance: 100000, type: 'investment', currency: user.currency, user: user._id }
      ];
      
      const createdWallets = await Wallet.insertMany(walletsData);
      console.log(`      ✅ Created ${createdWallets.length} wallets`);

      // --- 3. Expenses (Last 6 Months) ---
      console.log('   🧾 Seeding Transactions (Last 180 Days)...');
      const expenses = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 180); // Last 6 months (180 days)

      const VALID_PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'];

      // Generate ~300 random transactions
      for (let i = 0; i < 300; i++) {
        const isIncome = Math.random() > 0.8; // 20% income, 80% expense
        
        // Pick random category matching the type
        const catKeys = Object.keys(categories).filter(k => 
          categories[k].type === (isIncome ? 'income' : 'expense')
        );
        const randomCat = categories[catKeys[Math.floor(Math.random() * catKeys.length)]];
        
        // Pick random wallet
        const randomWallet = createdWallets[Math.floor(Math.random() * createdWallets.length)];
        
        // More realistic random amounts
        let amount;
        if (isIncome) {
          amount = Math.floor(Math.random() * 50000) + 5000;
        } else {
          // Some large expenses, but mostly smaller ones
          const rand = Math.random();
          if (rand > 0.95) {
            amount = Math.floor(Math.random() * 10000) + 5000; // Big purchase
          } else if (rand > 0.8) {
            amount = Math.floor(Math.random() * 3000) + 1000; // Medium purchase
          } else {
            amount = Math.floor(Math.random() * 900) + 100; // Small daily expense
          }
        }

        expenses.push({
          title: `${isIncome ? 'Income' : 'Expense'} from ${randomCat.name}`,
          amount: amount,
          category: randomCat._id, // Store ObjectID
          user: user._id,
          wallet: randomWallet._id, 
          description: `Generated Transaction ${i+1}`,
          date: getRandomDate(startDate, endDate),
          paymentMethod: VALID_PAYMENT_METHODS[Math.floor(Math.random() * VALID_PAYMENT_METHODS.length)],
          isRecurring: Math.random() > 0.98 // 2% recurring
        });
      }
      
      // Add regular Salary & Rent/Housing items
      for (let m = 0; m < 6; m++) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        d.setDate(1);
        
        // Monthly Salary
        expenses.push({
          title: 'Monthly Salary',
          amount: user.currency === 'LKR' ? 180000 : 5000,
          category: categories['Salary']._id,
          user: user._id,
          wallet: createdWallets[1]._id, // Bank
          description: 'Regular Monthly Salary',
          date: new Date(d),
          paymentMethod: 'bank_transfer',
          isRecurring: true
        });

        // Monthly Housing/Rent
        const housingDate = new Date(d);
        housingDate.setDate(5);
        expenses.push({
          title: 'Monthly Rent',
          amount: user.currency === 'LKR' ? 45000 : 1200,
          category: categories['Housing']._id,
          user: user._id,
          wallet: createdWallets[1]._id, // Bank
          description: 'Regular Housing Payment',
          date: housingDate,
          paymentMethod: 'bank_transfer',
          isRecurring: true
        });
      }

      await Expense.insertMany(expenses);
      console.log(`      ✅ Created ${expenses.length} transactions spread over 6 months`);

      // --- 4. Product Budgets ---
      console.log('   🎯 Seeding Product Budgets...');
      await ProductBudget.insertMany([
        {
          name: 'Gaming Setup Upgrade',
          targetAmount: user.currency === 'LKR' ? 350000 : 1200, 
          savedAmount: user.currency === 'LKR' ? 120000 : 400,
          targetDate: new Date('2024-12-31'),
          imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500', 
          isActive: true,
          user: user._id
        },
        {
          name: 'Summer Vacation 2025',
          targetAmount: user.currency === 'LKR' ? 600000 : 2500,
          savedAmount: user.currency === 'LKR' ? 550000 : 2200,
          targetDate: new Date('2025-06-15'),
          imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500',
          isActive: true,
          user: user._id
        },
        {
          name: 'Emergency Fund',
          targetAmount: user.currency === 'LKR' ? 1200000 : 5000,
          savedAmount: user.currency === 'LKR' ? 300000 : 1200,
          targetDate: new Date('2025-01-01'),
          imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560eb3e?w=500',
          isActive: true,
          user: user._id
        },
        {
          name: 'New iPhone',
          targetAmount: user.currency === 'LKR' ? 450000 : 1100,
          savedAmount: user.currency === 'LKR' ? 50000 : 100,
          targetDate: new Date('2024-11-20'),
          imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
          isActive: true,
          user: user._id
        },
        {
          name: 'MacBook Pro',
          targetAmount: user.currency === 'LKR' ? 750000 : 2500,
          savedAmount: user.currency === 'LKR' ? 700000 : 2400,
          targetDate: new Date('2024-10-10'),
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
          isActive: true,
          user: user._id
        }
      ]);
      console.log(`      ✅ Created 5 product budgets`);
    }

    // --- 5. Global Release Notes (Once) ---
    console.log('\n   📝 Seeding Global Release Notes...');
    await ReleaseNote.deleteMany({}); // Clear old ones
    await ReleaseNote.insertMany([
      {
        version: '1.0.0',
        date: new Date('2023-01-01'),
        features: ['Initial release', 'Expense tracking', 'Category management'],
        bugfixes: [],
        improvements: ['UI Setup'],
        isPublished: true
      },
      {
        version: '1.1.0',
        date: new Date('2023-03-15'),
        features: ['Dark mode support', 'Multi-currency support'],
        bugfixes: ['Fix login timeout', 'Fix generic avatars'],
        improvements: ['Performance optimizations'],
        isPublished: true
      },
      {
        version: '2.0.0',
        date: new Date('2023-08-10'),
        features: ['Product Budgets', 'Wallet Management', 'Advanced Analytics'],
        bugfixes: ['Mobile responsive layout'],
        improvements: ['New dashboard design', 'Faster loading'],
        isPublished: true
      },
      {
        version: '2.1.0',
        date: new Date(),
        features: ['Export to CSV', 'Budget Forecasting', 'Bill Reminders'],
        bugfixes: ['CORS issues with images', 'Date parsing on Safari'],
        improvements: ['Refactored service layer', 'Improved validation'],
        isPublished: true
      }
    ]);
    console.log('      ✅ Created 4 release notes');

    console.log('\n🎉 All dummy data seeded successfully!');
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    process.exit(1);
  }
}

seedDummyData();
