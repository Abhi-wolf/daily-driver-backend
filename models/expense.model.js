import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  modeOfPayment: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
  },
});

export const Expense = mongoose.model("Expense", expenseSchema);
