const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ReleaseNote = require('../src/models/ReleaseNote');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
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
    version: '2.0.0',
    date: new Date('2023-08-15'),
    features: [
      'Role-based access control for release notes management',
      'Admin dashboard for system-wide analytics and user management',
      'Multi-currency support for international expenses',
      'Automatic currency conversion based on daily exchange rates',
      'Dark mode support across all application screens',
      'Customizable dashboard with drag-and-drop widgets'
    ],
    bugfixes: [
      'Fixed user role not being properly retrieved in API responses',
      'Resolved image upload issues on certain mobile devices',
      'Fixed date formatting inconsistencies across different locales',
      'Corrected calculation errors in monthly budget summaries',
      'Fixed navigation issues when using browser back button'
    ],
    improvements: [
      'Enhanced authentication system with remember-me functionality',
      'Optimized database queries for faster expense report generation',
      'Improved mobile responsiveness on small screen devices',
      'Added comprehensive input validation across all forms',
      'Upgraded security with enhanced password policies and account lockout'
    ],
    isPublished: true
  },
  {
    version: '1.5.0',
    date: new Date('2023-05-20'),
    features: [
      'User profile customization with avatar uploads',
      'Budget planning tools with monthly and yearly views',
      'Expense prediction based on historical spending patterns',
      'CSV and PDF export for expense reports',
      'Email notifications for budget alerts',
      'Product budget management for tracking specific purchase goals'
    ],
    bugfixes: [
      'Fixed category deletion causing orphaned expenses',
      'Resolved login issues with certain email providers',
      'Fixed chart rendering problems on Firefox browsers',
      'Corrected percentage calculations in budget progress bars',
      'Fixed timezone issues affecting expense date recording'
    ],
    improvements: [
      'Redesigned user interface for better usability',
      'Faster page load times through code optimization',
      'Enhanced form validation with real-time feedback',
      'Improved accessibility for screen readers',
      'Better error messages with actionable solutions'
    ],
    isPublished: true
  },
  {
    version: '1.2.0',
    date: new Date('2023-03-10'),
    features: [
      'Analytics dashboard with spending insights',
      'Category-based expense filtering',
      'Expense tagging system for custom organization',
      'Recurring expense scheduling',
      'Monthly and annual spending reports',
      'Wallet import/export functionality'
    ],
    bugfixes: [
      'Fixed expense total miscalculation in certain categories',
      'Resolved user session timeout issues',
      'Fixed category color picker not working in Safari',
      'Corrected sorting issues in expense history',
      'Fixed search functionality not finding partial matches'
    ],
    improvements: [
      'Faster expense entry with quick-add shortcuts',
      'Improved date picker with calendar view',
      'Enhanced mobile experience with touch-friendly controls',
      'More detailed expense history with advanced filtering',
      'Optimized backend for faster response times'
    ],
    isPublished: true
  },
  {
    version: '1.1.0',
    date: new Date('2023-01-15'),
    features: [
      'Smart expense categorization based on merchant names',
      'Budget alerts when approaching spending limits',
      'Multiple wallet support for tracking different accounts',
      'Expense sharing functionality for group expenses',
      'Transaction history with advanced filtering'
    ],
    bugfixes: [
      'Fixed category creation issues on mobile devices',
      'Resolved authentication token expiration problems',
      'Fixed expense amounts rounding errors',
      'Corrected date filter not applying properly',
      'Fixed expense editing not updating budget calculations'
    ],
    improvements: [
      'Enhanced expense form with autocomplete suggestions',
      'Improved category management interface',
      'Better visual representations in reports and charts',
      'Simplified user registration process',
      'Faster synchronization between devices'
    ],
    isPublished: true
  },
  {
    version: '1.0.0',
    date: new Date('2022-11-01'),
    features: [
      'Core expense tracking functionality',
      'User account management with secure authentication',
      'Custom expense categories creation',
      'Basic reporting with monthly summaries',
      'Expense search and filtering capabilities',
      'Responsive design for mobile and desktop use',
      'Multiple wallet support with balance tracking'
    ],
    bugfixes: [
      'Fixed authentication issues with certain email formats',
      'Resolved expense totals not updating immediately',
      'Fixed category color selection not persisting',
      'Corrected date filtering bugs in reports',
      'Fixed user profile updates not saving properly'
    ],
    improvements: [
      'Streamlined expense entry process',
      'Enhanced visual design and user interface',
      'Improved application performance and loading times',
      'Better form validation and error handling',
      'More intuitive navigation between features'
    ],
    isPublished: true
  },
  {
    version: '0.9.0-beta',
    date: new Date('2022-09-15'),
    features: [
      'Initial beta release with core expense tracking',
      'Basic user authentication',
      'Simple expense categories',
      'Manual expense entry',
      'Basic monthly reporting',
      'Wallet creation and management'
    ],
    bugfixes: [
      'Fixed critical login issues preventing access',
      'Resolved data persistence problems',
      'Fixed expense deletion not working',
      'Corrected calculation errors in totals',
      'Fixed wallet balance calculation errors'
    ],
    improvements: [
      'Initial user interface implementation',
      'Basic responsive design',
      'Fundamental security measures',
      'Simple data validation',
      'Basic error handling'
    ],
    isPublished: true
  }
];

// Function to seed the release notes
async function seedReleaseNotes() {
  try {
    // Clear existing release notes
    await ReleaseNote.deleteMany({});
    console.log('✅ Existing release notes cleared');

    // Insert new release notes
    const result = await ReleaseNote.insertMany(releaseNotes);
    console.log(`✅ ${result.length} release notes added to the database`);
    
    // Log the seeded data summary
    console.log('\n📝 Seeded Release Notes Summary:');
    for (const note of result) {
      console.log(`
Version: ${note.version} (${new Date(note.date).toLocaleDateString()})
Features: ${note.features.length} items
Bugfixes: ${note.bugfixes.length} items
Improvements: ${note.improvements.length} items
Published: ${note.isPublished ? 'Yes' : 'No'}
      `);
    }

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error seeding release notes:', error);
    process.exit(1);
  }
}

// Run the seed function
seedReleaseNotes();
