import mongoose from "mongoose";
import { Expense } from "../models/expense.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Budget } from "../models/budget.model.js";

const addExpense = asyncHandler(async (req, res) => {
  const { category, description, date, amount, modeOfPayment } = req.body;
  const userId = req.user._id;

  if (!category || !date || !amount) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const expense = await Expense.create({
      createdBy: userId,
      category,
      description,
      date,
      amount,
      modeOfPayment,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, expense, "Expense added successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateExpense = asyncHandler(async (req, res) => {
  const { category, description, date, amount, modeOfPayment } = req.body;
  const userId = req.user._id;
  const { expenseId } = req.params;

  if (!category || !date || !amount) {
    throw new ApiError(400, "All fields are required");
  }

  const expense = await Expense.findById(expenseId);

  if (!expense || !expense.createdBy.equals(userId)) {
    throw new ApiError(404, "Expense not found");
  }

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(expenseId, {
      category,
      description,
      date,
      amount,
      modeOfPayment,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedExpense, "Expense added successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id;

  if (!expenseId) {
    throw new ApiError(400, "Expense Id is required");
  }

  const expense = await Expense.findById(expenseId);

  if (!expense || !expense.createdBy.equals(userId)) {
    throw new ApiError(400, "Expense not found");
  }

  try {
    const expense = await Expense.findByIdAndDelete(expenseId);
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getExpenses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;


  try {
    const start = startDate === "null" ? new Date() : new Date(startDate);
    const end = endDate === "null" ? new Date() : new Date(endDate);

    end.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      createdBy: userId,
      date: {
        $gte: start,
        $lt: end,
      },
    }).select("-createdBy -__v");

    const total = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: null, // No grouping key needed; we want the overall total
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    let categoryData = expenses.reduce((acc, item) => {
      const { category, amount } = item;

      acc[category] = (acc[category] || 0) + amount;

      return acc;
    }, {});

    categoryData = Object.entries(categoryData).map(
      ([category, totalAmount]) => ({
        category,
        totalAmount,
      })
    );

    const totalSpent = total[0]?.totalAmount || 0;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { expenses, totalSpent, categoryData },
          "Expenses fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getExpensesByMonth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentYear = new Date().getFullYear();

  try {
    const currentYearExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const prevoiusYearExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: new Date(currentYear - 1, 0, 1),
            $lt: new Date(currentYear, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    //   fill zero if there are no expenses
    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      curr: 0,
      prev: 0,
    }));

    currentYearExpenses.forEach(({ _id, totalAmount }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyExpenses[_id - 1].curr = totalAmount;
      }
    });

    prevoiusYearExpenses.forEach(({ _id, totalAmount }) => {
      if (_id >= 1 && _id <= 12) {
        monthlyExpenses[_id - 1].prev = totalAmount;
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, monthlyExpenses, "Success"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getExpenseSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const currMonth = new Date().getMonth();
  const currYear = new Date().getFullYear();

  try {
    let currentMonthBudget = await Budget.findOne({
      createdBy: userId,
      date: new Date(currYear, currMonth, 1),
    });

    currentMonthBudget = currentMonthBudget?.amount || 0;
    let prevMonthBudget = await Budget.findOne({
      createdBy: userId,
      date: new Date(currYear, currMonth - 1, 0),
    });

    prevMonthBudget = prevMonthBudget?.amount || 0;

    let currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: new Date(currYear, currMonth, 1),
            $lt: new Date(currYear, currMonth + 1, 0),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    let prevoiusMonthExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: {
            $gte: new Date(currYear, currMonth - 1, 0),
            $lt: new Date(currYear, currMonth, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    currentMonthExpenses = currentMonthExpenses[0]?.totalAmount || 0;
    prevoiusMonthExpenses = prevoiusMonthExpenses[0]?.totalAmount || 0;

    const currentMonthSavings = currentMonthBudget - currentMonthExpenses;
    const prevMonthSavings = prevMonthBudget - prevoiusMonthExpenses;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          currentMonthBudget,
          prevMonthBudget,
          currentMonthExpenses,
          prevoiusMonthExpenses,
          currentMonthSavings,
          prevMonthSavings,
        },
        "Expense summary successfully calculated"
      )
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getExpensesByMonth,
};
