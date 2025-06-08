import { File } from "../models/file.model.js";
import { Folder } from "../models/folder.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Sentry from "@sentry/node";

const createFile = asyncHandler(async (req, res) => {
  const { fileName, parentFolder, data } = req.body;
  const userId = req.user._id;

  if (!fileName) {
    throw new ApiError(404, "File name is required");
  }

  try {
    const newFile = await File.create({
      fileName,
      parentFolder: parentFolder ? parentFolder : null,
      data,
      createdBy: userId,
    });

    if (parentFolder) {
      await Folder.findByIdAndUpdate(parentFolder, {
        $push: {
          items: {
            itemType: "File",
            itemId: newFile._id,
          },
        },
      });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newFile, "File created successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user._id;

  // console.log("BODY= ", req.body);

  if (!fileId) {
    throw new ApiError(404, "File id is required");
  }

  const file = await File.findOne({ _id: fileId, deleted: { $ne: true } });

  if (!file || !file.createdBy.equals(userId)) {
    throw new ApiError(404, "File not found");
  }

  try {
    if (req.body?.newName) {
      file.fileName = req.body.newName;
    } else if (req.body?.data) {
      file.data = req.body.data;
    }
    await file.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "File updated successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getAllFiles = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const files = await File.find({
      createdBy: userId,
      deleted: { $ne: true },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, files, "All the user files"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getFile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fileId } = req.params;

  const file = await File.findOne({
    _id: fileId,
    createdBy: userId,
    deleted: { $ne: true },
  }).select("data fileName");

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, file, "File fetched successfully"));
});

const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    throw new ApiError(400, "File is required");
  }

  const file = await File.findOne({ _id: fileId, deleted: { $ne: true } });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  try {
    file.deleted = true;
    await file.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "File deleted successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const restoreFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    throw new ApiError(400, "File is required");
  }

  const file = await File.findOne({ _id: fileId, deleted: { $ne: false } });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  const parentFolder = await Folder.findOne({
    _id: file.parentFolder,
    deleted: { $ne: true },
  });

  // if (!parentFolder) {
  //   throw new ApiError(400, "Restoration not possible");
  // }

  try {
    file.deleted = false;
    await file.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "File restored successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const permanentDeleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    throw new ApiError(400, "File is required");
  }

  const file = await File.findOne({ _id: fileId, deleted: { $ne: false } });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  try {
    if (file.parentFolder) {
      await Folder.findByIdAndUpdate(file.parentFolder, {
        $pull: { items: { itemId: fileId, itemType: "File" } },
      });
    }

    await File.findByIdAndDelete(fileId);

    return res
      .status(200)
      .json(new ApiResponse(200, "File deleted permanently"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getAllDeletedFiles = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const files = await File.find({
      createdBy: userId,
      deleted: { $ne: false },
    });

    return res.status(200).json(new ApiResponse(200, files, "Deleted Files"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export {
  createFile,
  getAllFiles,
  restoreFile,
  deleteFile,
  updateFile,
  getFile,
  permanentDeleteFile,
  getAllDeletedFiles,
};
