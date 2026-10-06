const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const receiptOcrService = require('../services/receiptOcrService');
const { parseReceiptText } = require('../utils/receiptParser');
const { matchCategory } = require('../utils/categoryMatcher');
const { successResponse } = require('../utils/responseFormatter');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { RECEIPT_DIR, resolveInside, receiptUrl, isOwnedBy } = require('../config/storage');

/**
 * @desc    Scan a receipt image and return pre-filled expense fields (no expense
 *          is created — the user reviews and confirms in the UI).
 * @route   POST /api/v1/expenses/receipt/scan
 * @access  Private
 */
const scanReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Please upload a receipt image');
  }


  // 1. OCR the image (gracefully degrades when OCR is not configured).
  const { configured, rawText } = await receiptOcrService.extractText(req.file.path);

  // 2. Parse the text into structured fields.
  const parsed = parseReceiptText(rawText);

  // 3. Suggest a category from the merchant/description.
  const categories = await Category.find({ user: req.user.id, isActive: true });
  const suggestedCategory = matchCategory(parsed.merchant || rawText, categories, { type: 'expense' });

  const message = configured
    ? 'Receipt scanned successfully'
    : 'Receipt stored. OCR is not configured (set OCR_API_KEY) — please fill in the details manually.';

  successResponse(res, {
    receipt: receiptUrl(req.file.filename),
    ocrConfigured: configured,
    suggestion: {
      title: parsed.title,
      amount: parsed.amount,
      date: parsed.date,
      merchant: parsed.merchant,
      category: suggestedCategory ? suggestedCategory._id : null,
      categoryName: suggestedCategory ? suggestedCategory.name : null
    },
    rawText
  }, 200, message);
});

/**
 * @desc    Stream one of the signed-in user's receipt images
 * @route   GET /api/v1/expenses/receipts/:fileName
 * @access  Private (owner only)
 */
const getReceipt = asyncHandler(async (req, res) => {
  const filePath = resolveInside(RECEIPT_DIR, req.params.fileName);

  // Someone else's receipt answers exactly like a missing one, so the endpoint
  // can't be used to probe which files exist.
  if (!filePath || !isOwnedBy(req.params.fileName, req.user.id)) {
    throw new NotFoundError('Receipt not found');
  }

  res.set('Cache-Control', 'private, max-age=3600');
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
    }
  });
});

module.exports = { scanReceipt, getReceipt };
