# Data Migration Scripts

This folder contains scripts to help with data migration and maintenance of the expense tracker application.

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
