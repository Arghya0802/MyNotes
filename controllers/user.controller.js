import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log(user);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    // console.log(accessToken, refreshToken);
    user.refreshToken = refreshToken;
    // Before saving data into our MongoDB, we don't need Password, UserName validations
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // console.log(error);
    return new ApiError(500, error);
  }
};

export const registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, userName, email, mobile, password } = req.body;

  //   console.log(userName, email, password, firstName, lastName, mobile);

  if (!userName || !email || !password || !firstName || !lastName || !mobile)
    return next(
      new ApiError(400, "Please Enter Required Details before Proceeding!!!")
    );

  //   console.log(email, mobile, userName);

  const existedUser = await User.findOne({
    $or: [{ email }, { mobile }, { userName: userName.toLowerCase() }],
  });

  //   console.log(existedUser);
  if (existedUser) return next(new ApiError(409, "User Already Exists!!!"));

  let profileLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.profile) &&
    req.files.profile.length > 0
  )
    profileLocalPath = req.files.profile[0].path;

  const profile = await uploadOnCloudinary(profileLocalPath);

  const newUser = await User.create({
    firstName,
    lastName,
    userName,
    mobile,
    password,
    email,
    profile: profile ? profile.url : "",
  });
  if (!newUser) return next(new ApiError(500, "Internal Server Error!!!"));

  return res.status(201).json({
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userName: newUser.userName.toLowerCase(),
    email: newUser.email,
    mobile: newUser.mobile,
    profile: newUser.profile,
    message: "User Registered Successfully",
    success: true,
  });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, userName, password } = req.body;

  if (!userName && !email)
    return next(new ApiError(400, "Please enter UserName or Email"));

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user)
    return next(new ApiError(404, "No User found with given details!!!"));

  const isValid = await user.isPasswordCorrect(password);

  if (!isValid)
    return next(new ApiError(401, "Please enter Correct Password!!!"));
  // console.log(user);
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  // console.log(accessToken);
  // console.log(refreshToken);
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );

  // Options are designed so that cookies are edited from server-side only
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      loggedInUser,
      accessToken,
      refreshToken,
      message: "User Logged-In Successfully",
      success: true,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  const user = req.user;

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      id: user._id,
      userName: user._userName,
      email: user.email,
      message: "User logged out successfully",
      success: true,
    });
});

// TODO: User is asked to refresh his Access-Token as his/her session is expired
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken)
    return next(new ApiError(401, "No Refresh Token found!!!"));

  const decodedRefreshToken = jwt.verify(
    incomingToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  // const decodedRefreshToken = incomingToken;

  if (!decodedRefreshToken)
    return next(
      new ApiError(500, "Internal Server Error while decoding Refresh Token")
    );

  const id = decodedRefreshToken._id;

  // console.log(decodedToken, _id);
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) return next(new ApiError(400, "Invalid MongoDB ID"));

  const user = await User.findById(id).select(
    "-firstName -lastName -password -profile"
  );

  if (!user) return next(new ApiError(404, "No User found!!!"));

  const userRefreshToken = jwt.verify(
    user.refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  // console.log(userRefreshToken);
  // console.log(decodedRefreshToken);

  if (decodedRefreshToken._id !== userRefreshToken._id)
    return next(new ApiError(401, "Un-Authorized Access"));

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    id
  );

  const loggedInUser = await User.findById(id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      loggedInUser,
      accessToken,
      refreshToken,
      message: "New Access Token created successfully!!!",
      success: true,
    });
});
