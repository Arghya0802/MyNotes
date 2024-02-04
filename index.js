import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./db/connectDB.js";
import todoRouter from "./routes/todo.routes.js";
import userRouter from "./routes/user.routes.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Basic configuration set-up to receive JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Server should listen only when database is connected
connectDB();
app.listen(PORT, () => {
  console.log(`Server is listening at PORT: ${PORT}`);
});

// User Routes
app.use("/api/v1/user", userRouter);

// Todo Routes
app.use("/api/v1/user/todo", todoRouter);

// Error Handler Middleware
app.use(notFoundMiddleware);
app.use(errorMiddleware);
