import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createFolder,
  deleteFolder,
  getAllDeletedFolders,
  getAllFolders,
  getFolder,
  permanentDeleteFolder,
  renameFolder,
  restoreFolder,
} from "../controllers/folder.controller.js";

const router = Router();

router.route("/").post(verifyJWT, createFolder);
router.route("/").get(verifyJWT, getAllFolders);
router.route("/deletedFolders").get(verifyJWT, getAllDeletedFolders);
router.route("/:folderId").get(verifyJWT, getFolder);
router.route("/:folderId").delete(verifyJWT, deleteFolder);
router.route("/:folderId").patch(verifyJWT, renameFolder);
router.route("/restore/:folderId").patch(verifyJWT, restoreFolder);
router
  .route("/permanentDelete/:folderId")
  .delete(verifyJWT, permanentDeleteFolder);

export default router;
