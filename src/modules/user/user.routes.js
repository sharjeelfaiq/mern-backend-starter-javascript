import express from "express";

import { verifyRole } from "#middleware/validator.js";
import { uploadFile } from "#middleware/upload.js";
import { userControllers } from "./user.controllers.js";

export const userRoutes = express.Router();

userRoutes
  .get("/", userControllers.getUsers)
  .get("/:id", userControllers.getById)
  .patch("/:id", uploadFile, userControllers.updateById)
  .delete("/:id", verifyRole("admin"), userControllers.deleteById);
