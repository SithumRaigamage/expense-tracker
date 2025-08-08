const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ReleaseNote = require('../src/models/ReleaseNote');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample release notes data
const releaseNotes = [
  {
    version: '1.0.0',
    date: new Date('2024-04-06'),
    features: [
      'Initial release with core wallet management',
      'Dashboard with expense tracking',
      'Multiple wallet support',
      'Budget planning tools'
    ],
    bugfixes: [],
    improvements: [],
    isPublished: true
  },
  {
    version: '0.9.0-beta',
    date: new Date('2024-03-15'),
    features: [
      'Beta testing of wallet features',
      'Transaction categorization'
    ],
    bugfixes: [
      'Fixed wallet balance calculation',
      'Corrected currency display issues'
    ],
    improvements: [
      'Enhanced loading performance',
      'Optimized dashboard renders'
    ],
    isPublished: true
  }
];

// Function to seed the release notes
async function seedReleaseNotes() {
  try {
    // Clear existing release notes
    await ReleaseNote.deleteMany({});
    console.log('Existing release notes cleared');

    // Insert new release notes
    const result = await ReleaseNote.insertMany(releaseNotes);
    console.log(`${result.length} release notes added to the database`);

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error seeding release notes:', error);
    process.exit(1);
  }
}

// Run the seed function
seedReleaseNotes();
