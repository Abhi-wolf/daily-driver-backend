import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addSong,
  deleteSong,
  getAllSongs,
} from "../controllers/song.controller.js";
import { multerUpload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .post(
    verifyJWT,
    multerUpload("songs").fields([{ name: "songFile" }]),
    addSong
  );
router.route("/").get(verifyJWT, getAllSongs);
router.route("/:songId").delete(verifyJWT, deleteSong);

export default router;
