import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  updateTodoStatus,
} from "../controllers/todo.controller.js";

const router = Router();

router.route("/").post(verifyJWT, createTodo);
router.route("/").get(verifyJWT, getTodos);
router.route("/:todoId").delete(verifyJWT, deleteTodo);
router.route("/:todoId").patch(verifyJWT, updateTodo);
router.route("/statusupdate/:todoId").patch(verifyJWT, updateTodoStatus);

export default router;
