import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createFile,
  deleteFile,
  getAllDeletedFiles,
  getAllFiles,
  getFile,
  permanentDeleteFile,
  restoreFile,
  updateFile,
} from "../controllers/file.controller.js";

const router = Router();

router.route("/").post(verifyJWT, createFile);
router.route("/").get(verifyJWT, getAllFiles);
router.route("/deletedFiles").get(verifyJWT, getAllDeletedFiles);
router.route("/:fileId").get(verifyJWT, getFile);
router.route("/:fileId").delete(verifyJWT, deleteFile);
router.route("/:fileId").patch(verifyJWT, updateFile);
router.route("/restore/:fileId").patch(verifyJWT, restoreFile);
router.route("/permanentDelete/:fileId").delete(verifyJWT, permanentDeleteFile);

export default router;
