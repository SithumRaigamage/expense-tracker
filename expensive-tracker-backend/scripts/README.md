# Scripts

This directory contains utility scripts for the Expense Tracker application.

## Available Scripts

### Seed Release Notes

```bash
node seedReleaseNotes.js
```

This script populates the database with sample release notes. It will:

- Clear all existing release notes
- Add comprehensive release notes with features, bugfixes, and improvements
- Display a summary of the seeded data

The script includes detailed release notes for versions:

- 2.0.0 (Latest) - Role-based release notes and admin features
- 1.5.0 - User profile and budget management features
- 1.2.0 - Analytics dashboard and reporting features
- 1.1.0 - Smart categorization and multiple wallet support
- 1.0.0 - Initial stable release with core functionality
- 0.9.0-beta - Beta release with basic features

### Clear Categories

```bash
node clearCategories.js
```

This script removes all categories from the database.

### Seed User

```bash
node seedUser.js
```

This script creates a default user in the database.

### Update User References

```bash
node updateUserReferences.js
```

This script updates user references in the database.

## Notes

- These scripts require the application's environment variables to be properly configured
- Make sure MongoDB is running before executing these scripts
- Some scripts may clear existing data, so use with caution in production environments

## updateUserReferences.js

This script automatically reassigns all orphaned records (expenses, product budgets, and wallets) to the first user found in the database. This is useful when you've deleted and recreated the users table but want to preserve the existing data.

### Usage

```bash
cd expensive-tracker-backend
node scripts/updateUserReferences.js
```

## reassignOrphanedData.js

This script provides an interactive way to reassign orphaned records to a specific user of your choice. It will:

1. Show a list of all users currently in the database
2. Show counts of orphaned records
3. Let you choose which user should own all the orphaned data

### Usage

```bash
cd expensive-tracker-backend
node scripts/reassignOrphanedData.js
```

Follow the on-screen prompts to select which user should receive the orphaned data.

## When to use these scripts

- After deleting and recreating the users table
- After running the seedUser.js script to create new test users
- When you notice that previously created data is not appearing in the application

These scripts help maintain referential integrity in your MongoDB database when the user IDs have changed.
