const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Function to update user role
async function updateUserRole(email, newRole) {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Update user role
    user.role = newRole;
    await user.save();
    
    console.log(`User ${user.name} (${user.email}) role updated to ${newRole}`);
    console.log('User data:', user);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
}

// Get email from command line arguments or use default
const email = process.argv[2] || 'sraig2002@gmail.com';
const role = process.argv[3] || 'admin';

console.log(`Updating user with email ${email} to role ${role}...`);
updateUserRole(email, role);
