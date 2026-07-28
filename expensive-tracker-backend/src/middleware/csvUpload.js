const multer = require('multer');
const path = require('path');

/**
 * In-memory upload for CSV bank statements. The file never needs to persist —
 * the controller reads the buffer as text and hands it to the parser — so
 * memory storage keeps it simple and avoids cluttering the uploads directory.
 */
const ALLOWED_MIME = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel' // Excel commonly labels .csv this way
];

const fileFilter = (req, file, cb) => {
  const extOk = path.extname(file.originalname).toLowerCase() === '.csv';
  const mimeOk = ALLOWED_MIME.includes(file.mimetype);
  if (extOk || mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Only .csv files are allowed'));
};

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

module.exports = csvUpload;
