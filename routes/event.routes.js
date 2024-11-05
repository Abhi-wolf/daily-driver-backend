import { Router } from "express";
import {
  addEvent,
  deleteEvent,
  getUserEvents,
  updateEvent,
} from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addEvent);
router.route("/").get(verifyJWT, getUserEvents);
router.route("/:eventId").delete(verifyJWT, deleteEvent);
router.route("/:eventId").put(verifyJWT, updateEvent);

export default router;
