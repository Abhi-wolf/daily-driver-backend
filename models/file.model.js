import mongoose from "mongoose";

// here deleted option is added to avail for restore
const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    type: {
      type: String,
      default: "file",
    },
    parentFolder: {
      type: mongoose.Schema.ObjectId,
      ref: "Folder",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    data: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const File = mongoose.model("File", fileSchema);
