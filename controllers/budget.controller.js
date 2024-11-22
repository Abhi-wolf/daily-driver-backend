import { Budget } from "../models/budget.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Sentry from "@sentry/node";

const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { amount, description } = req.body;

  if (amount < 0) {
    return res
      .status(400)
      .json(new ApiError(400, "Amount must be non-negative"));
  }

  const currYear = new Date().getFullYear();
  const currMonth = new Date().getMonth();

  try {
    const budget = await Budget.findOneAndUpdate(
      {
        createdBy: userId,
        date: new Date(currYear, currMonth, 1),
      },
      {
        amount: amount,
        description: description,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, budget, "Budget updated successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export { updateBudget };
