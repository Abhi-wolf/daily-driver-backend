import { Folder } from "../models/folder.model.js";
import { File } from "../models/file.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Sentry from "@sentry/node";

const createFolder = asyncHandler(async (req, res) => {
  const { folderName, parentFolder } = req.body;
  const userId = req.user._id;

  let parent = null;
  if (parentFolder) {
    parent = await Folder.findById(parentFolder);

    if (!parent || parent?.deleted) {
      throw new ApiError(400, "Parent folder not found");
    }
  }

  try {
    const newFolder = await Folder.create({
      folderName,
      parentFolder,
      createdBy: userId,
    });

    if (parent) {
      await Folder.findByIdAndUpdate(parentFolder, {
        $push: {
          items: {
            itemType: "Folder",
            itemId: newFolder._id,
          },
        },
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, newFolder, "Folder created successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getAllFolders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    const folders = await Folder.find({
      createdBy: userId,
      parentFolder: null,
      deleted: { $ne: true },
    })
      .populate({
        path: "items.itemId",
        match: { deleted: { $ne: true } },
      })
      .lean();

    // Filter out any items where itemId is null
    const filteredFolders = folders?.map((folder) => {
      if (!folder.items) return folder;

      const filteredItems = folder?.items?.filter(
        (item) => item.itemId !== null
      );
      const mappedItems = filteredItems.map((item) => item.itemId);

      return {
        ...folder,
        items: mappedItems, // Update folder's items with the mapped itemIds
      };
    });

    const files = await File.find({
      createdBy: userId,
      parentFolder: null,
      deleted: { $ne: true },
    });

    const fileExplorer = [...filteredFolders, ...files];

    return res
      .status(200)
      .json(new ApiResponse(200, fileExplorer, "All the user folders"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const userId = req.user._id;

  if (!folderId) {
    throw new ApiError(404, "Folder id is required");
  }

  const folder = await Folder.findOne({
    _id: folderId,
    deleted: { $ne: true },
  });

  if (!folder || !folder.createdBy.equals(userId)) {
    throw new ApiError(404, "Folder not found");
  }

  try {
    const folder = await Folder.findOne({
      _id: folderId,
      deleted: { $ne: true },
    })
      .populate({ path: "items.itemId", match: { deleted: { $ne: true } } })
      .lean();

    if (folder?.items) {
      const filteredItems = folder?.items?.filter(
        (item) => item.itemId !== null
      );
      const mappedItems = filteredItems.map((item) => item.itemId);

      folder.items = mappedItems;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, folder, "Folder fetched successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const deleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    throw new ApiError(400, "Folder id is required");
  }

  const folder = await Folder.findOne({
    _id: folderId,
    deleted: { $ne: true },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }
  try {
    folder.deleted = true;
    await folder.save();

    // recursively delete all folder and files
    const markAsDeleted = async (currentFolderId) => {
      // folder deletion
      const subFolders = await Folder.find({ parentFolder: currentFolderId });
      for (const subFolder of subFolders) {
        subFolder.deleted = true;
        await subFolder.save();
        await markAsDeleted(subFolder._id);
      }

      // files deletion
      await File.updateMany(
        { parentFolder: currentFolderId },
        { deleted: true }
      );
    };

    await markAsDeleted(folderId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Folder deleted successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const restoreFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    throw new ApiError(400, "Folder id is required");
  }
  const folder = await Folder.findOne({
    _id: folderId,
    deleted: { $ne: false },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }
  try {
    folder.deleted = false;
    await folder.save();

    // recursively delete all folder and files
    const markAsRestored = async (currentFolderId) => {
      // folder deletion
      const subFolders = await Folder.find({ parentFolder: currentFolderId });
      for (const subFolder of subFolders) {
        subFolder.deleted = false;
        await subFolder.save();
        await markAsRestored(subFolder._id);
      }

      // files deletion
      await File.updateMany(
        { parentFolder: currentFolderId },
        { deleted: false }
      );
    };

    await markAsRestored(folderId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Folder restored successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const permanentDeleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    throw new ApiError(400, "Folder id is required");
  }

  // check if the folder is in trash or not -- if its not in trash do not delete
  const folder = await Folder.findOne({
    _id: folderId,
    deleted: { $ne: false },
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }
  try {
    // remove the folder reference from its parents items
    if (folder.parentFolder) {
      await Folder.findByIdAndUpdate(folder.parentFolder, {
        $pull: { items: { itemId: folderId, itemType: "Folder" } },
      });
    }

    await Folder.findByIdAndDelete(folderId);

    // recursively delete all folder and files
    const permanentDelete = async (currentFolderId) => {
      // folder deletion
      const subFolders = await Folder.find({ parentFolder: currentFolderId });
      for (const subFolder of subFolders) {
        await Folder.findByIdAndDelete(subFolder._id);
        await permanentDelete(subFolder._id);
      }

      // files deletion
      await File.deleteMany({ parentFolder: currentFolderId });
    };

    await permanentDelete(folderId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Folder deleted permanently"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const renameFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { newName } = req.body;
  const userId = req.user._id;

  if (!folderId) {
    throw new ApiError(404, "Folder id is required");
  }

  const folder = await Folder.findOne({
    _id: folderId,
    deleted: { $ne: true },
  });

  if (!folder || !folder.createdBy.equals(userId)) {
    throw new ApiError("Folder not found");
  }

  try {
    folder.folderName = newName;
    await folder.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Folder name updated successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getAllDeletedFolders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const folders = await Folder.find({ createdBy: userId, deleted: true });

  return res.status(200).json(new ApiResponse(200, folders, "Deleted folders"));
});

export {
  createFolder,
  getAllFolders,
  deleteFolder,
  restoreFolder,
  getFolder,
  renameFolder,
  permanentDeleteFolder,
  getAllDeletedFolders,
};
