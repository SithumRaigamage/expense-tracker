const express = require('express');
const router = express.Router();
const { importBankStatement, importSms } = require('../controllers/importController');
const { protect } = require('../middleware/auth');
const csvUpload = require('../middleware/csvUpload');
const { BadRequestError } = require('../utils/errors');

// All import routes require authentication.
router.use(protect);

// Wrap multer so upload problems (wrong type, too large) surface as 400s, not 500s.
const uploadCsv = (req, res, next) => {
  csvUpload.single('file')(req, res, (err) => {
    if (err) return next(new BadRequestError(err.message));
    next();
  });
};

// Accepts a multipart .csv file (field "file") or a JSON body with a "csv" string.
// multer skips non-multipart requests, so JSON bodies still reach the controller.
router.post('/bank', uploadCsv, importBankStatement);
router.post('/sms', importSms);

module.exports = router;
