const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { FILE_UPLOAD } = require('../config/constants');
const { UPLOAD_DIR, RECEIPT_DIR } = require('../config/storage');
const { BadRequestError } = require('../utils/errors');

const ensureDir = (dir) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch (error) {
    logger.error(`Upload directory ${dir} is not writable: ${error.message}`);
  }
};

/**
 * Image upload middleware writing into `dir`.
 *
 * File names are generated server-side as `<userId>-<random>.<ext>`: nothing
 * from the client's original file name reaches the disk except a whitelisted
 * extension, and the user-id prefix is what the receipt endpoint uses to check
 * ownership.
 */
const createImageUpload = (dir) => {
  ensureDir(dir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const owner = req.user ? req.user.id : 'anonymous';
      cb(null, `${owner}-${crypto.randomUUID()}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const extOk = FILE_UPLOAD.ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = FILE_UPLOAD.ALLOWED_MIMETYPES.includes(file.mimetype);

    if (extOk && mimeOk) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed'));
  };

  return multer({
    storage,
    limits: { fileSize: FILE_UPLOAD.MAX_SIZE, files: 1 },
    fileFilter
  });
};

/**
 * Wraps `upload.single(field)` so a rejected file (wrong type, too large) is a
 * 400 the user can act on rather than a generic server error.
 */
const singleImage = (uploader, field) => (req, res, next) => {
  uploader.single(field)(req, res, (err) => {
    if (!err) {
      return next();
    }
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `File is too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
      : err.message;
    next(new BadRequestError(message));
  });
};

/** Profile pictures — the public upload directory. */
const upload = createImageUpload(UPLOAD_DIR);

/** Receipt images — the private receipt directory. */
const receiptUpload = createImageUpload(RECEIPT_DIR);

module.exports = upload;
module.exports.receiptUpload = receiptUpload;
module.exports.createImageUpload = createImageUpload;
module.exports.singleImage = singleImage;
