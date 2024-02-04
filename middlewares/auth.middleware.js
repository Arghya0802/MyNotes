import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) return next(new ApiError(401, "Un-Authorized Access!!!"));
    // TODO:
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded)
      return next(
        new ApiError(500, "Something went wrong while decoding Access Token")
      );

    const user = await User.findById(decoded._id);

    if (!user)
      return next(
        new ApiError(404, "No User found with given Access Token!!!")
      );

    req.user = user;
    next();
  } catch (error) {
    return next(error);
  }
});
