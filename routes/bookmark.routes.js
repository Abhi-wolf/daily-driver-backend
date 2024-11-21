import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addBookmark,
  deleteBookmark,
  getUserBookmarks,
  updateBookmark,
} from "../controllers/bookmark.controller.js";

const router = Router();

router.route("/").get(verifyJWT, getUserBookmarks);
router.route("/").post(verifyJWT, addBookmark);
router.route("/:bookmarkId").patch(verifyJWT, updateBookmark);
router.route("/:bookmarkId").delete(verifyJWT, deleteBookmark);

export default router;
