import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
// import dotenv from "dotenv";
// dotenv.config();

export const connectDB = async () => {
  try {
    const { connections } = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database is connected successfully!!!`);

    console.log(
      `Connection String: ${connections[0]._connectionString}\nHost: ${connections[0].host}, Port: ${connections[0].port} and Database Name: ${connections[0].name}`
    );
  } catch (error) {
    console.log(`Failed to connect to MongoDB Database`);
    throw error.message;
  }
};
