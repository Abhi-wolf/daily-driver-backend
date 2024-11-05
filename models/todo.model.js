import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    todoName: {
      type: String,
      required: [true, "Todo task is required"],
    },
    todoDescription: {
      type: String,
    },
    dueDate: {
      type: Date,
      default: Date.now(),
    },
    label: {
      type: String,
    },
    done: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Todo = mongoose.model("Todo", todoSchema);
