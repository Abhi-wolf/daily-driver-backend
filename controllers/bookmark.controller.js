import { Bookmark } from "../models/bookmark.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addBookmark = asyncHandler(async (req, res) => {
  const { url, title, labels, category } = req.body;

  if (!url || !title) {
    throw new ApiError(400, "Url and title are required");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const oldbookmark = await Bookmark.findOne({ createdBy: userId, url });

  if (oldbookmark) {
    throw new ApiError(409, "Url is already bookmarked");
  }

  try {
    const newbookmark = await Bookmark.create({
      createdBy: userId,
      url,
      title,
      category,
      labels,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newbookmark, "Bookmarked successfully "));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateBookmark = asyncHandler(async (req, res) => {
  const { bookmarkId } = req.params;

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const oldbookmark = await Bookmark.findById(bookmarkId);

  if (!oldbookmark || !oldbookmark.createdBy.equals(userId)) {
    throw new ApiError(409, "Bookmark not found");
  }

  try {
    const newbookmark = await Bookmark.findByIdAndUpdate(bookmarkId, req.body);

    return res
      .status(200)
      .json(new ApiResponse(200, newbookmark, "Bookmarked successfully "));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getUserBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Number(req.query?.page) || 1;
  const limit = Number(req.query?.limit) || 9;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const skip = (page - 1) * limit;

  const bookmarks = await Bookmark.find({ createdBy: userId })
    .skip(skip)
    .limit(limit);

  if (!bookmarks) {
    throw new ApiError(404, "Bookmarks not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, bookmarks, "User bookmarks"));
});

const deleteBookmark = asyncHandler(async (req, res) => {
  const { bookmarkId } = req.params;
  const userId = req.user._id;

  if (!bookmarkId) {
    throw new ApiError(400, "Bookmark Id is required");
  }

  const bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark || !bookmark.createdBy.equals(userId)) {
    throw new ApiError(404, "Bookmark not found");
  }

  try {
    await Bookmark.findByIdAndDelete(bookmarkId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Bookmark deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export { getUserBookmarks, deleteBookmark, addBookmark, updateBookmark };
