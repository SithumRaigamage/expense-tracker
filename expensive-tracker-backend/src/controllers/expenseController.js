const Expense = require('../models/Expense');
const Category = require('../models/Category');

// @desc    Get all expenses for user
// @route   GET /api/v1/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      type,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user.id };

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const expenses = await Expense.find(filter)
      .populate('category', 'name color icon')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/v1/expenses/:id
// @access  Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('category', 'name color icon');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/v1/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Ensure we have either title or description
    if (!req.body.title && !req.body.description) {
      return res.status(400).json({
        success: false,
        error: 'Either title or description is required'
      });
    }

    // If no title provided, use description
    if (!req.body.title) {
      req.body.title = req.body.description;
    }

    // Validate category exists and belongs to user
    if (req.body.category) {
      const categoryExists = await Category.findOne({
        _id: req.body.category,
        user: req.user.id
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }
    }

    const expense = await Expense.create(req.body);
    
    // Populate category before returning
    await expense.populate('category', 'name color icon');

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    // Ensure we have either title or description
    if (!req.body.title && !req.body.description) {
      return res.status(400).json({
        success: false,
        error: 'Either title or description is required'
      });
    }

    // If no title provided, use description
    if (!req.body.title) {
      req.body.title = req.body.description;
    }

    // Validate category if provided
    if (req.body.category) {
      const categoryExists = await Category.findOne({
        _id: req.body.category,
        user: req.user.id
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name color icon');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense statistics
// @route   GET /api/v1/expenses/stats/summary
// @access  Private
const getExpenseStats = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    // Build date filter
    const dateFilter = { user: req.user.id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get total income and expenses
    const totalStats = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get expenses by category
    const categoryStats = await Expense.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          color: { $first: '$categoryInfo.color' },
          icon: { $first: '$categoryInfo.icon' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get monthly/weekly breakdown based on groupBy
    let groupByExpression;
    switch (groupBy) {
      case 'week':
        groupByExpression = { 
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      case 'day':
        groupByExpression = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      default: // month
        groupByExpression = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
    }

    const timeSeriesStats = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupByExpression,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: totalStats[0] || { totalAmount: 0, totalTransactions: 0, avgAmount: 0 },
        categoryBreakdown: categoryStats,
        timeSeries: timeSeriesStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly expenses for specific month/year
// @route   GET /api/v1/expenses/monthly
// @access  Private
const getMonthlyExpenses = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required'
      });
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);

    const expenses = await Expense.find({
      user: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('category', 'name color icon')
    .sort({ date: -1 });

    // Calculate monthly stats
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;

    res.status(200).json({
      success: true,
      data: {
        expenses,
        summary: {
          totalExpenses,
          expenseCount,
          month: parseInt(month),
          year: parseInt(year)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlyExpenses
};
