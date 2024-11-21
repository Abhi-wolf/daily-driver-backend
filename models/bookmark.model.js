import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: [true, "Bookmark Link is required"],
    },
    labels: {
      type: Array,
      default: [],
    },
    category: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
