import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addNewLabel,
  deleteLabel,
  getLabels,
} from "../controllers/label.controller.js";

const router = Router();

router.route("/").get(verifyJWT, getLabels);
router.route("/").post(verifyJWT, addNewLabel);
router.route("/:labelId").delete(verifyJWT, deleteLabel);

export default router;
