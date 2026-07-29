const asyncHandler = require('express-async-handler');
const BillService = require('../services/billService');
const { successResponse, createdResponse } = require('../utils/responseFormatter');

/**
 * @desc    List the user's bills, soonest due first
 * @route   GET /api/v1/bills
 * @access  Private
 */
const getBills = asyncHandler(async (req, res) => {
  const bills = await BillService.getBills(req.user.id);
  successResponse(res, bills);
});

/**
 * @desc    Get a single bill
 * @route   GET /api/v1/bills/:id
 * @access  Private
 */
const getBill = asyncHandler(async (req, res) => {
  const bill = await BillService.getBill(req.params.id, req.user.id);
  successResponse(res, bill);
});

/**
 * @desc    Create a bill
 * @route   POST /api/v1/bills
 * @access  Private
 */
const createBill = asyncHandler(async (req, res) => {
  const bill = await BillService.createBill(req.body, req.user.id);
  createdResponse(res, bill);
});

/**
 * @desc    Update a bill
 * @route   PUT /api/v1/bills/:id
 * @access  Private
 */
const updateBill = asyncHandler(async (req, res) => {
  const bill = await BillService.updateBill(req.params.id, req.user.id, req.body);
  successResponse(res, bill, 200, 'Bill updated successfully');
});

/**
 * @desc    Soft-delete a bill
 * @route   DELETE /api/v1/bills/:id
 * @access  Private
 */
const deleteBill = asyncHandler(async (req, res) => {
  await BillService.deleteBill(req.params.id, req.user.id);
  successResponse(res, {}, 200, 'Bill deleted successfully');
});

/**
 * @desc    Pay a bill from a wallet, recording the expense
 * @route   POST /api/v1/bills/:id/pay
 * @access  Private
 */
const payBill = asyncHandler(async (req, res) => {
  const result = await BillService.payBill(req.params.id, req.user.id, req.body.walletId);
  successResponse(res, result, 200, 'Bill paid successfully');
});

module.exports = { getBills, getBill, createBill, updateBill, deleteBill, payBill };
