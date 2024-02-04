import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    myTodos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Todo",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const hashed = await bcrypt.hash(this.password, 10);

    // console.log(`Password hashed successfully!!!`);
    // console.log(hashed);
    this.password = hashed;
    next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new ApiError(500, "Internal Server Error while Password Check!!!");
  }
};

// jwt.sign({data}, secret_key, {expiresIn: expiryDate})
userSchema.methods.generateAccessToken = async function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal Server Error while generating Access Token!!!"
    );
  }
};

userSchema.methods.generateRefreshToken = async function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  } catch (error) {
    throw new ApiError(
      500,
      "Internal Server error while generating Refresh Token!!!"
    );
  }
};

userSchema.methods.addTodo = async function (todoId) {
  try {
    if (!this.myTodos.includes(todoId)) {
      this.myTodos.push(todoId);
      await this.save();
    }
  } catch (error) {
    throw new ApiError(
      500,
      "Internal Server error while adding Todos to MyTodos !!!"
    );
  }
};

userSchema.methods.updateTodo = async function (todoId) {
  try {
    this.myTodos = this.myTodos.filter(
      (id) => id.toString() !== todoId.toString()
    );
    this.myTodos.push(todoId);
    await this.save();
  } catch (error) {
    // console.log(error);
    throw new ApiError(
      500,
      "Internal Server Error while Updating Todo in myTodos !!!"
    );
  }
};

userSchema.methods.removeTodo = async function (todoId) {
  try {
    this.myTodos = this.myTodos.filter(
      (id) => id.toString() !== todoId.toString()
    );
    await this.save();
  } catch (error) {
    throw new ApiError(
      500,
      "Internal Sever error while deleting Todos from MyTodos !!!"
    );
  }
};

const User = mongoose.model("User", userSchema);
export default User;
