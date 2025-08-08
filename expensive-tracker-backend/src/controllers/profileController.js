const multer = require('multer');
const upload = require('../middleware/fileUpload');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Upload profile image and update profile info in one request
 * @route   POST /api/v1/users/profile/image
 * @access  Private
 */
const uploadProfileImage = async (req, res) => {
  try {
    console.log('Profile image upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    if (!req.user || !req.user.id) {
      console.error('User not authenticated properly');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated properly'
      });
    }
    
    if (!req.file) {
      console.error('No file provided in request');
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    // Get the server URL for the file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    console.log('Generated file URL:', fileUrl);
    
    // Double check that the file exists
    const filePath = path.join(__dirname, '../../public/uploads', req.file.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
    } else {
      console.log(`File successfully saved at: ${filePath}`);
    }

    // Prepare update object with image URL and any additional profile fields from body
    const updateData = { 
      profileImage: fileUrl,
      // Add other fields if they exist in the request body
      ...(req.body.firstName && { firstName: req.body.firstName }),
      ...(req.body.lastName && { lastName: req.body.lastName }),
      ...(req.body.bio && { bio: req.body.bio }),
      ...(req.body.phone && { phone: req.body.phone }),
      ...(req.body.location && { location: req.body.location }),
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.role && { role: req.body.role })
    };
    
    console.log('Update data:', updateData);

    // First check if user exists
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      console.error(`User with ID ${req.user.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user with new profile image URL and other data
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      console.error('Failed to update user with new profile data');
      return res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }

    // Also update avatar field for backward compatibility
    if (!user.avatar) {
      user.avatar = fileUrl;
      await user.save();
    }

    // Ensure the user object has the updated profileImage URL
    user.profileImage = fileUrl;
    
    console.log('Profile updated successfully');
    console.log('Returning profile image URL:', fileUrl);
    console.log('User object with profileImage:', user);
    
    // Return the data with the updated user object that has the profileImage URL
    res.status(200).json({
      success: true,
      data: {
        profileImage: fileUrl,
        user: {
          ...user.toObject(), // Convert Mongoose document to plain object
          profileImage: fileUrl // Ensure profileImage is in the response
        }
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    // Provide more specific error messages based on error type
    let statusCode = 500;
    let errorMessage = 'Server error during file upload';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid user ID format';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * @desc    Delete profile image
 * @route   DELETE /api/v1/users/profile/image
 * @access  Private
 */
const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has a profile image
    if (!user.profileImage) {
      return res.status(400).json({
        success: false,
        error: 'No profile image to delete'
      });
    }

    // Try to delete the file if it's stored locally
    try {
      const imagePath = user.profileImage.split('/uploads/')[1];
      if (imagePath) {
        const fullPath = path.join(process.env.FILE_UPLOAD_PATH || './public/uploads', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (err) {
      console.error('Error deleting image file:', err);
      // Continue even if file deletion fails
    }

    // Update user to remove profile image
    user.profileImage = '';
    await user.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Profile image delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during image deletion'
    });
  }
};

module.exports = {
  uploadProfileImage,
  deleteProfileImage
};
