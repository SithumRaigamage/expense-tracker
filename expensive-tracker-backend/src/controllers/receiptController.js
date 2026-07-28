const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const receiptOcrService = require('../services/receiptOcrService');
const { parseReceiptText } = require('../utils/receiptParser');
const { matchCategory } = require('../utils/categoryMatcher');
const { successResponse } = require('../utils/responseFormatter');
const { BadRequestError } = require('../utils/errors');

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

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const receiptUrl = `${baseUrl}/uploads/${req.file.filename}`;

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
    receipt: receiptUrl,
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

module.exports = { scanReceipt };
