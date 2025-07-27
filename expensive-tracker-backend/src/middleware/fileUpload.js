const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadPath = process.env.FILE_UPLOAD_PATH || './public/uploads';
try {
  if (!fs.existsSync(uploadPath)) {
    console.log(`Creating upload directory: ${uploadPath}`);
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  // Verify directory is writable
  fs.accessSync(uploadPath, fs.constants.W_OK);
  console.log(`Upload directory ${uploadPath} is writable`);
} catch (error) {
  console.error(`Error with upload directory: ${error.message}`);
  // Fallback to a temp directory if main directory isn't accessible
  console.log('Falling back to temp directory');
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Double-check directory exists before writing
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`Created upload directory on demand: ${uploadPath}`);
      } catch (err) {
        console.error(`Failed to create directory: ${err.message}`);
        return cb(new Error('Could not create upload directory'), null);
      }
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    try {
      // Generate unique filename: user_id-timestamp-original_filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const userId = req.user ? req.user.id : 'unknown';
      const uniqueSuffix = `${userId}-${timestamp}-${randomSuffix}`;
      const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
      console.log(`Generated filename: ${filename}`);
      cb(null, filename);
    } catch (err) {
      console.error(`Error generating filename: ${err.message}`);
      cb(new Error('Error generating filename'), null);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only image files (jpg, jpeg, png, gif) are allowed!'));
  }
};

// Create upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

module.exports = upload;
