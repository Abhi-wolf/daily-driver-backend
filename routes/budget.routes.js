import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateBudget } from "../controllers/budget.controller.js";

const router = Router();

router.route("/").put(verifyJWT, updateBudget);

export default router;
