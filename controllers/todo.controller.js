import Todo from "../models/todo.model.js";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import mongoose from "mongoose";

export const createTodo = asyncHandler(async (req, res, next) => {
  if (!req.body.title || !req.body.description)
    return next(new ApiError(400, "No Title or Description or both"));

  const { title, description } = req.body;
  const oldTodo = await Todo.findOne({ title });

  if (oldTodo) return next(new ApiError(400, "Todo already exists"));

  let imageLocalPath;

  if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0)
    imageLocalPath = req.files.image[0].path;

  const image = await uploadOnCloudinary(imageLocalPath);
  const user = req.user;

  const newTodo = await Todo.create({
    title,
    description,
    image: image ? image.url : "",
    createdBy: user._id,
  });

  if (!newTodo)
    return next(
      new ApiError(500, "Internal Server error while Todo Creation!!!")
    );

  // const user = req.user;

  await user.addTodo(newTodo._id);

  res.status(200).json({
    userName: user.userName,
    email: user.email,
    newTodo,
    message: "Todo created successfully",
    success: true,
  });
});

export const getAllTodos = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const todos = await user.populate("myTodos");

  res.status(200).json({
    todos,
    message: "All User Todos fetched successfully",
    success: true,
  });
});

export const getOneTodo = asyncHandler(async (req, res, next) => {
  if (!req.params.id) return next(new ApiError(400, "No ID found"));

  const { id } = req.params;

  // IsValid is just used to check if MongoDB ID is in the correct format or not
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) return next(new ApiError(400, "Invalid MongoDB ID"));

  const myTodo = await Todo.findById(id);

  if (!myTodo) return next(new ApiError(400, "No Todo found!!!"));

  res.status(200).json({
    userName: req.user.userName,
    email: req.user.email,
    myTodo,
    message: "One Particular Todo is fetched successfully!!!",
    success: true,
  });
});

export const updateTodo = asyncHandler(async (req, res, next) => {
  if (!req.params.id) return next(new ApiError(400, "No ID found"));

  const { id } = req.params;

  // IsValid is just used to check if MongoDB ID is in the correct format or not
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) return next(new ApiError(400, "Invalid MongoDB ID"));

  const myTodo = await Todo.findById(id);
  let imageLocalPath;

  if (!myTodo) return next(new ApiError(404, "No Todo found!!!"));

  if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0)
    imageLocalPath = req.files.image[0].path;

  const image = await uploadOnCloudinary(imageLocalPath);

  // Object.assign(myTodo, req.body);
  // await myTodo.save();
  let myUpdatedTodo;

  if (image && image.url === "") {
    myUpdatedTodo = await Todo.findByIdAndUpdate(id, req.body, { new: true });
  } else {
    myUpdatedTodo = await Todo.findByIdAndUpdate(
      id,
      {
        title: req.body?.title,
        description: req.body?.description,
        image: image.url,
        isCompleted: req.body?.isCompleted,
      },
      { new: true }
    );
  }

  await req.user.updateTodo(myUpdatedTodo._id);

  res.status(200).json({
    userName: req.user.userName,
    email: req.user.email,
    myUpdatedTodo,
    message: "My Todo is updated successfully!!!",
    success: true,
  });
});

export const deleteTodo = asyncHandler(async (req, res, next) => {
  if (!req.params.id) return next(new ApiError(400, "No ID found"));

  const { id } = req.params;

  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) return next(new ApiError(400, "Invalid MongoDB ID"));

  const myTodo = await Todo.findById(id);

  if (!myTodo) return next(new ApiError(400, "No Todo found!!!"));

  const removedTodo = await Todo.findByIdAndDelete(id);

  await req.user.removeTodo(removedTodo._id);

  res.status(200).json({
    userName: req.user.userName,
    email: req.user.email,
    removedTodo,
    message: "User Todo deleted successfully!!!",
    success: true,
  });
});
