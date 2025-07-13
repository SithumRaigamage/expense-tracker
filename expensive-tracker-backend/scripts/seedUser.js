const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const seedUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('👤 Test user already exists:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Currency: ${existingUser.currency}`);
      console.log(`   Active: ${existingUser.isActive}`);
      return;
    }

    // Create test user
    const testUser = await User.create({
      name: 'sithum raigamage',
      email: 'sraig2002@gmail.com',
      password: 'password123',
      currency: 'LKR',
      isActive: true
    });

    console.log('✅ Test user created successfully:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Currency: ${testUser.currency}`);
    console.log(`   Active: ${testUser.isActive}`);
    console.log('');
    console.log('🔑 You can now login with:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Create a more realistic user as well
const seedRealisticUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if Sithum user already exists
    const existingUser = await User.findOne({ email: 'sraig2002@gmail.com' });
    
    if (existingUser) {
      console.log('👤 Sithum user already exists:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Currency: ${existingUser.currency}`);
      console.log(`   Active: ${existingUser.isActive}`);
      return;
    }

    // Create Sithum user
    const sithumUser = await User.create({
      name: 'Sithum Raigamage',
      email: 'sraig2002@gmail.com',
      password: 'sithum123',
      currency: 'LKR',
      isActive: true
    });

    console.log('✅ Sithum user created successfully:');
    console.log(`   ID: ${sithumUser._id}`);
    console.log(`   Email: ${sithumUser.email}`);
    console.log(`   Name: ${sithumUser.name}`);
    console.log(`   Currency: ${sithumUser.currency}`);
    console.log(`   Active: ${sithumUser.isActive}`);
    console.log('');
    console.log('🔑 You can now login with:');
    console.log('   Email: sraig2002@gmail.com');
    console.log('   Password: sithum123');

  } catch (error) {
    console.error('❌ Error creating Sithum user:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run both seed functions
const runSeed = async () => {
  console.log('🌱 Starting user seeding...\n');
  
  await seedUser();
  console.log('');
  await seedRealisticUser();
  
  console.log('\n🎉 User seeding completed!');
  process.exit(0);
};

runSeed();
