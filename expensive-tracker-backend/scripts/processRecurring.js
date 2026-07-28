const mongoose = require('mongoose');
require('dotenv').config();
const RecurringService = require('../src/services/recurringService');

/**
 * Standalone runner for the recurring-expense engine.
 *
 * Generates any recurring occurrences that are due, then exits. Designed to be
 * invoked on a schedule (system cron, a CI/cloud cron job, or `npm run recurring:run`)
 * so you never have to enter repeating expenses (rent, subscriptions, salary) by hand.
 */
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const summary = await RecurringService.processDueRecurringExpenses({ now: new Date() });

    console.log('🔁 Recurring expense run summary:');
    console.log(`   Templates scanned:        ${summary.totalTemplates}`);
    console.log(`   Templates with new items: ${summary.templatesWithNewOccurrences}`);
    console.log(`   Occurrences created:      ${summary.occurrencesCreated}`);
    console.log(`   Errors:                   ${summary.errors}`);
  } catch (error) {
    console.error('❌ Recurring expense run failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

run();
