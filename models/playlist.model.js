import mongoose from "mongoose";

const playListSchema = new mongoose.Schema({
  playListName: {
    type: String,
    required: [true, "Playlist name is required"],
  },
  songs: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Song",
    },
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

export const Playlist = mongoose.model("Playlist", playListSchema);
