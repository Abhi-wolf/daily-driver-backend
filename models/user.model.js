import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    profilePic: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    isThirdParty: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },

    // folders and files object
    userFileFolder: {
      type: Object,
      default: {
        id: "1",
        name: "root",
        isFolder: true,
        items: [],
      },
    },

    // projects
    projects: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Project",
      },
    ],

    // events
    events: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Event",
      },
    ],

    // labels
    labels: [
      {
        labelName: {
          type: String,
          required: [true, "Label name is required"],
        },
        labelColor: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isThirdParty) return next();
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  if (this.isThirdParty) return next();

  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      email: this.email,
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model("User", userSchema);
