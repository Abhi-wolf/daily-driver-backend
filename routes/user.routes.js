import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  getUser,
  updateFolder,
  userFileExplorer,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller.js";

const router = Router();

/**
 * @route POST /register
 * @access Public
 * @desc Register a new user
 * @param {object} req.body - User registration details
 * @returns {object} 201 - Created
 * @returns {object} 400 - Bad Request
 */
router.route("/register").post(registerUser);

/**
 * @route POST /login
 * @access Public
 * @desc Authenticate user and login
 * @param {object} req.body - User credentials
 * @returns {object} 200 - Authentication token
 * @returns {object} 400 - Bad Request
 */
router.route("/login").post(loginUser);

/**
 * @route POST /logout
 * @access Private
 * @desc Logout user
 * @middleware verifyJWT
 * @returns {object} 200 - Success
 * @returns {object} 401 - Unauthorized
 */
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/currentUser").post(verifyJWT, getUser);
router.route("/updateFolder").post(verifyJWT, updateFolder);
router.route("/getUserFileExplorer").get(verifyJWT, userFileExplorer);
router.route("/forgotPassword").patch(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);

export default router;
