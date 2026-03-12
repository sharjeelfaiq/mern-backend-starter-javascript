import express from "express";

import {
  passwordResetRequestDto,
  passwordUpdateDto,
  signinDto,
  signupDto,
} from "./auth.dto.js";
import { validateDto, verifyAccessToken } from "#middleware/validator.js";
import { authControllers } from "./auth.controllers.js";

export const authRoutes = express.Router();

authRoutes
  .post("/signup", validateDto(signupDto), authControllers.signUp)
  .post("/signin", validateDto(signinDto), authControllers.signIn)
  .post("/signout", verifyAccessToken, authControllers.signOut)
  .post(
    "/request-password-reset",
    validateDto(passwordResetRequestDto),
    authControllers.requestPasswordReset,
  )
  .patch(
    "/update-password",
    validateDto(passwordUpdateDto),
    authControllers.updatePassword,
  );
