const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError 
} = require('../utils/errors');

/**
 * Service layer for user operations
 */
class UserService {
  /**
   * Generate JWT Token
   * @param {string} userId 
   * @returns {string} token
   */
  static generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
  }

  /**
   * Register a new user
   * @param {Object} userData 
   * @returns {Promise<Object>} Created user and token
   */
  static async register(userData) {
    const { name, email, password, currency } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      currency: currency || 'LKR'
    });

    // Generate token
    const token = this.generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        role: user.role
      },
      token
    };
  }

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} User and token
   */
  static async login(email, password) {
    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        role: user.role
      },
      token
    };
  }

  /**
   * Get user profile
   * @param {string} userId 
   * @returns {Promise<Object>} User profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updateData 
   * @returns {Promise<Object>} Updated user
   */
  static async updateProfile(userId, updateData) {
    const fieldsToUpdate = {
      name: updateData.name,
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      currency: updateData.currency,
      avatar: updateData.avatar,
      profileImage: updateData.profileImage,
      phone: updateData.phone,
      bio: updateData.bio,
      location: updateData.location,
      role: updateData.role
    };

    // Construct composite name if needed
    if (!fieldsToUpdate.name && fieldsToUpdate.firstName && fieldsToUpdate.lastName) {
      fieldsToUpdate.name = `${fieldsToUpdate.firstName} ${fieldsToUpdate.lastName}`;
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      userId,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Change password
   * @param {string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<boolean>} True if successful
   */
  static async changePassword(userId, currentPassword, newPassword) {
    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Verify Token / Get User status
   * @param {string} userId 
   * @returns {Promise<Object>} User public data
   */
  static async verifyToken(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        role: user.role
      },
      valid: true
    };
  }
}

module.exports = UserService;
