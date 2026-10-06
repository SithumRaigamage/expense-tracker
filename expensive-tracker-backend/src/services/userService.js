const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const { tokenLifetimeSeconds } = require('../utils/authCookie');
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
   * Issue a session token.
   *
   * - `tv` is the user's tokenVersion at issue time; `protect` rejects the
   *   token once that version moves on (password change).
   * - `jti` is unique per token so a single session can be revoked (logout).
   * - The lifetime comes from the same setting as the cookie.
   *
   * @param {{ _id: *, tokenVersion?: number }} user
   * @returns {string} token
   */
  static generateToken(user) {
    return jwt.sign(
      { id: user._id.toString(), tv: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: tokenLifetimeSeconds(), jwtid: crypto.randomUUID() }
    );
  }

  /**
   * End one session before its natural expiry by denylisting its `jti`.
   * Idempotent: logging out twice with the same token is not an error.
   *
   * @param {{ jti?: string, exp?: number }} claims - Verified token claims
   */
  static async revokeToken(claims) {
    // Tokens issued before jti existed can't be listed; they still expire on
    // their own and die with the next password change.
    if (!claims || !claims.jti || !claims.exp) {
      return;
    }

    await RevokedToken.updateOne(
      { jti: claims.jti },
      { $setOnInsert: { jti: claims.jti, expiresAt: new Date(claims.exp * 1000) } },
      { upsert: true }
    );
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
    const token = this.generateToken(user);

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
    // tokenVersion is needed so the issued token carries the current session generation.
    const user = await User.findOne({ email }).select('+password +tokenVersion');

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
    const token = this.generateToken(user);

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
      // `avatar` and `profileImage` are set only by the upload endpoint, to a
      // server-generated file name. Accepting them here let a user store a
      // path such as "../../.env" that the delete endpoint then unlinked.
      phone: updateData.phone,
      bio: updateData.bio,
      location: updateData.location,
      // `role` is deliberately absent: it drives authorization and must never
      // be settable by the user it describes.
      occupation: updateData.occupation
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
   * Change password and end every other session.
   *
   * Bumping tokenVersion invalidates all outstanding tokens — including one a
   * thief may hold, which is usually *why* the password is being changed. A
   * fresh token is returned so the session making the change stays signed in.
   *
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<string>} A new token for the current session
   */
  static async changePassword(userId, currentPassword, newPassword) {
    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters');
    }

    const user = await User.findById(userId).select('+password +tokenVersion');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return this.generateToken(user);
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
