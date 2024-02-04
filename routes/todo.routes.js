import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  getOneTodo,
  updateTodo,
} from "../controllers/todo.controller.js";
const router = express.Router();

router.post(
  "/",
  verifyJWT,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  createTodo
);

router.get("/:id", verifyJWT, getOneTodo);
router.get("/", verifyJWT, getAllTodos);

router.patch(
  "/:id",
  verifyJWT,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateTodo
);
router.delete("/:id", verifyJWT, deleteTodo);

export default router;
