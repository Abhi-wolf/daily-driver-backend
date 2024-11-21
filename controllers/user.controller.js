import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

/**
 * @desc Generate new access token and refresh token
 * @param {string} userId - userId of the user
 * @returns {Object} The newly generated access token and refresh token
 * @access Public
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    // fetch user from database
    const user = await User.findOne(userId);

    // generate access token
    const accessToken = user.generateAccessToken();

    // generate refresh token
    const refreshToken = user.generateRefreshToken();

    // save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // return access token and refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

/**
 * @route POST /api/v1/users/register
 * @desc Create a new user
 * @param {string} name - Name of the user
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object} The created user
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  // destructure name,email and password from the request body
  const { name, email, password } = req.body;

  // check if all the fields are present
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // check if the user already exist with the same email
  const existingUser = await User.findOne({ email });

  // if the user already exist throw a new error with status code 409
  if (existingUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // craete new user
  let user = {};
  try {
    user = await User.create({
      name,
      email,
      password,
    });
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }

  // fetch the newly created user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check if the user is created or not if not then return new error with status code 500
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // destructure access and refresh token from the function
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    createdUser._id
  );

  // define options for cookie
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 5 * 24 * 60 * 60 * 1000,
  };

  // set the cookies and return email and name with the response object
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            email: createdUser.email,
            name: createdUser.name,
            profilePic: createdUser.profilePic,
          },
          accessToken,
          refreshToken,
        },
        "User Signed Up Successfully"
      )
    );
});

/**
 * @route POST /api/v1/users/login
 * @desc Login user
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object} The logged in user and set the cookies
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  // destructure email and password from the request body
  const { email, password } = req.body;

  // return a new error with status code 400 if email or password is not found in the request body
  if (!email || !password) {
    throw new ApiError(400, "Email and password both are required");
  }

  // fetch the user from the database using email
  const existinguser = await User.findOne({ email });

  // if user does not exist return new error with status code 404
  if (!existinguser) {
    throw new ApiError(404, "Invalid email or password");
  }

  // verify the emtered password
  const isPasswordCorrect = await existinguser.isPasswordCorrect(password);

  // if password is not correct return a new error with status code 401
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // destructure access and refresh token from the function
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existinguser._id
  );

  // define options for cookie
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 5 * 24 * 60 * 60 * 1000,
  };

  // set the cookies and return email and name with the response object
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            email: existinguser.email,
            name: existinguser.name,
            profilePic: existinguser.profilePic,
          },
          taskLabels: existinguser.labels,
          bookmarkLabels: existinguser.bookmarkLabels,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

/**
 * @route POST /api/v1/users/logout
 * @desc Logout user
 * @returns {Object} The empty object and clear the cookies
 * @access Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  // find the user and remove the refresh token field from the document
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  // define options for the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear cookies and return the empty object with status code 200
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * @route GET /api/v1/user/currentUser
 * @desc Login user
 * @param {string} email - Email of the user
 * @param {string} password - Password of the user
 * @returns {Object} The logged in user and set the cookies
 * @access Public
 */
const getUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // return a new error with status code 400 if email or password is not found in the request body
  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  // fetch the user from the database using email
  const existinguser = await User.findOne({ _id: userId });

  // if user does not exist return new error with status code 404
  if (!existinguser) {
    throw new ApiError(404, "User does not exits");
  }

  const songs = (await Song.find({ createdBy: userId }))?.length;
  const bookmarks = (await Bookmark.find({ createdBy: userId }))?.length;
  const projects = (await Project.find({ createdBy: userId }))?.length;

  const data = {
    user: {
      email: existinguser.email,
      name: existinguser.name,
      profilePic: existinguser.profilePic,
    },
    songs,
    bookmarks,
    projects,
  };

  // set the cookies and return email and name with the response object
  return res
    .status(200)
    .json(new ApiResponse(200, data, "User fetched Successfully"));
});

const updateFolder = asyncHandler(async (req, res) => {
  try {
    const email = req.user.email;
    const { finalTree } = req.body;

    if (!email) {
      throw new ApiError(400, "Unauthorized access");
    }

    if (!finalTree) {
      throw new ApiError(400, "Data not provided");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    user.userFileFolder = finalTree;
    await user.save();

    const updatedUserData = await User.findOne({ email });

    const fileExplore = updatedUserData.userFileFolder;

    return res
      .status(200)
      .json(new ApiResponse(200, fileExplore, "Successfully updated"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
});

const userFileExplorer = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      throw new ApiError(400, "Unauthorized access");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const data = user.userFileFolder;

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Successfully fetched"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  try {
    if (user) {
      const resetToken = user.createPasswordResetToken();
      await user.save();

      const resetLink = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;

      const message = `
        <p>Dear ${user.name},</p>
        <p>We received a request to reset your password for your account. If you made this request, please click the link below to reset your password:</p>
        <a href="${resetLink}"><strong>Reset Password</strong></a>
        <p>This link will expire in 01 hour only. If you did not request a password reset, you can safely ignore this email.</p>
        <p>Best regards,<br/>The Team</p>
      `;

      await sendEmail({
        email,
        subject: "Password Reset Request (Token valid for 01 hour only)",
        message,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, "Password Reset Email sent successfully"));
    }
  } catch (error) {
    if (user) {
      user.passwordResetExpires = undefined;
      user.passwordResetToken = undefined;
      await user.save();
    }
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Token not found");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid");
  }

  try {
    user.password = password;
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Password reset successfull"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (req.body?.currentPassword) {
    const isPasswordCorrect = await user.isPasswordCorrect(
      req.body.currentPassword
    );

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Current password is not correct");
    }
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.newPassword) user.password = req.body.newPassword;

  try {
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Profile updated successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Error"));
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateFolder,
  userFileExplorer,
  forgotPassword,
  resetPassword,
  updateProfile,
};
