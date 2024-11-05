import mongoose from "mongoose";

// here deleted option is added to avail for restore
const folderSchema = new mongoose.Schema(
  {
    folderName: {
      type: String,
      required: [true, "Folder name is required"],
    },
    type: {
      type: String,
      default: "folder",
    },
    parentFolder: {
      type: mongoose.Schema.ObjectId,
      ref: "Folder",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    items: [
      {
        itemType: {
          type: String,
          required: true,
          enum: ["Folder", "File"],
        },
        itemId: {
          type: mongoose.Schema.ObjectId,
          refPath: "items.itemType",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Folder = mongoose.model("Folder", folderSchema);
