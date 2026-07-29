const asyncHandler = require('express-async-handler');
const BankImportService = require('../services/bankImportService');
const { parseBankCsv } = require('../utils/bankStatementParser');
const { parseSmsMessages } = require('../utils/smsParser');
const { successResponse } = require('../utils/responseFormatter');
const { BadRequestError } = require('../utils/errors');

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

/**
 * @desc    Import expenses from a bank-statement CSV.
 * @route   POST /api/v1/imports/bank
 * @access  Private
 * @body    { csv: string, walletId?, defaultCategoryId?, dryRun? }
 */
const importBankStatement = asyncHandler(async (req, res) => {
  const { walletId, defaultCategoryId } = req.body;
  const dryRun = toBool(req.body.dryRun);

  // Accept either an uploaded .csv file (multipart "file") or raw CSV text.
  const csv = req.file ? req.file.buffer.toString('utf8') : req.body.csv;

  if (!csv || typeof csv !== 'string') {
    throw new BadRequestError('Provide a .csv file (field "file") or the CSV text in the "csv" field');
  }

  const transactions = parseBankCsv(csv);
  if (transactions.length === 0) {
    throw new BadRequestError('No valid transactions found in the CSV');
  }

  const summary = await BankImportService.importTransactions(transactions, req.user.id, {
    walletId, defaultCategoryId, dryRun
  });

  successResponse(res, summary, 200,
    dryRun ? 'Import preview generated' : `Imported ${summary.created} transaction(s)`);
});

/**
 * @desc    Import expenses from bank transaction-alert SMS messages.
 * @route   POST /api/v1/imports/sms
 * @access  Private
 * @body    { messages: string[], walletId?, defaultCategoryId?, dryRun? }
 */
const importSms = asyncHandler(async (req, res) => {
  const { messages, walletId, defaultCategoryId } = req.body;
  const dryRun = toBool(req.body.dryRun);

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new BadRequestError('Provide an array of SMS strings in the "messages" field');
  }

  const transactions = parseSmsMessages(messages);
  if (transactions.length === 0) {
    throw new BadRequestError('No recognizable transaction alerts found in the messages');
  }

  const summary = await BankImportService.importTransactions(transactions, req.user.id, {
    walletId, defaultCategoryId, dryRun
  });

  successResponse(res, summary, 200,
    dryRun ? 'Import preview generated' : `Imported ${summary.created} transaction(s)`);
});

module.exports = { importBankStatement, importSms };
