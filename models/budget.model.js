import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0,
    min: [0, "Amount cannot be lesser than zero"],
  },
});

budgetSchema.index({ createdBy: 1, date: 1 }, { unique: true });

export const Budget = mongoose.model("Budget", budgetSchema);
