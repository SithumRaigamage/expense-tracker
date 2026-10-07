const fs = require('fs/promises');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { UPLOAD_DIR, resolveInside, publicUploadUrl } = require('../config/storage');

/** Profile fields the multipart form may update alongside the picture. */
const PROFILE_FIELDS = ['name', 'firstName', 'lastName', 'bio', 'phone', 'location', 'occupation'];

/**
 * Removes a previously stored profile picture from disk.
 *
 * The stored value is only ever treated as a file *name* inside UPLOAD_DIR
 * (see resolveInside). It used to be split on "/uploads/" and joined onto the
 * directory as-is, so a profileImage of ".../uploads/../../.env" deleted the
 * server's .env file. Failures are logged, never fatal: a missing file must not
 * stop the user from changing their picture.
 */
const removeStoredImage = async (storedValue) => {
  const filePath = resolveInside(UPLOAD_DIR, storedValue);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('Failed to remove profile image file', { message: error.message });
    }
  }
};

/**
 * @desc    Upload profile image and update profile info in one request
 * @route   POST /api/v1/users/profile/image
 * @access  Private
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Please upload a file');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    await removeStoredImage(req.file.filename);
    throw new NotFoundError('User not found');
  }

  const previousImage = user.profileImage;
  const fileUrl = publicUploadUrl(req.file.filename);

  const updates = { profileImage: fileUrl };
  PROFILE_FIELDS.forEach(field => {
    if (typeof req.body[field] === 'string' && req.body[field] !== '') {
      updates[field] = req.body[field];
    }
  });
  if (!user.avatar) {
    updates.avatar = fileUrl;
  }

  let updated;
  try {
    updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  } catch (error) {
    // Don't leave the just-written file orphaned when the profile fields fail validation.
    await removeStoredImage(req.file.filename);
    throw error;
  }

  // Replace, don't accumulate: the old picture is unreachable once the profile
  // points elsewhere.
  if (previousImage && previousImage !== fileUrl) {
    await removeStoredImage(previousImage);
  }

  logger.info('Profile image updated', { userId: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      profileImage: fileUrl,
      user: updated
    }
  });
});

/**
 * @desc    Delete profile image
 * @route   DELETE /api/v1/users/profile/image
 * @access  Private
 */
const deleteProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.profileImage) {
    throw new BadRequestError('No profile image to delete');
  }

  await removeStoredImage(user.profileImage);

  if (user.avatar === user.profileImage) {
    user.avatar = '';
  }
  user.profileImage = '';
  await user.save();

  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  uploadProfileImage,
  deleteProfileImage
};
