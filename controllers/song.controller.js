import { Playlist } from "../models/playlist.model.js";
import { Song } from "../models/song.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFile, uploadFile } from "../utils/uploadFile.js";

const addSong = asyncHandler(async (req, res) => {
  const { songName, songImageUrl, playListName } = req.body;

  if (!songName) {
    throw new ApiError(400, "All fields are required");
  }

  let localFilePath = req.files?.songFile?.[0]?.path;

  if (!localFilePath) {
    throw new ApiError(400, "Song url not present");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  try {
    const playList = await Playlist.findOne({
      playListName,
      createdBy: userId,
    });

    let songUrl = "";
    let metadata = {};
    if (localFilePath) {
      let { url, metadata } = await uploadFile(localFilePath);

      if (!url) {
        throw new ApiError(500, "Internal Error -- song not uploaded");
      } else {
        songUrl = url;
      }
    }

    let song = await Song.create({
      songName,
      songUrl,
      songImageUrl,
      metadata,
      createdBy: userId,
    });

    if (playList) {
      playList.songs.push(song._id);
      await playList.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, song, "Song successfully uploaded"));
  } catch (error) {
    console.error("error = ", error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getAllSongs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const songs = await Song.find({ createdBy: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, songs, "Songs fetched successfully"));
});

const deleteSong = asyncHandler(async (req, res) => {
  const { songId } = req.params;
  const userId = req.user._id;

  if (!songId) {
    throw new ApiError(404, "Song Id not found");
  }

  const song = await Song.findById(songId);

  if (!song) {
    throw new ApiError(404, "Song  not found");
  }

  if (!song.createdBy.equals(userId)) {
    throw new ApiError(403, "Unauthorized access");
  }

  try {
    const fileUrl = song.songUrl;

    await deleteFile(fileUrl);
    await Song.findByIdAndDelete(songId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Song successfully deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export { addSong, getAllSongs, deleteSong };
