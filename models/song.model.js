import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
  songName: {
    type: String,
    required: [true, "Song name is required"],
  },
  songUrl: {
    type: String,
    required: [true, "Song url path is required"],
  },
  songImageUrl: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  metadata: {
    type: Object,
  },
});

export const Song = mongoose.model("Song", songSchema);
