import express from "express";

import { authDto } from "./auth.dto.js";
import { validateMiddleware as validate } from "#middleware/index.js";
import { authControllers } from "./auth.controllers.js";

export const authRoutes = express.Router();

authRoutes
  .post("/signup", validate.dto(authDto.signupDto), authControllers.signUp)
  .post("/signin", validate.dto(authDto.signinDto), authControllers.signIn)
  .post("/signout", validate.accessToken, authControllers.signOut)
  .post(
    "/request-password-reset",
    validate.dto(authDto.passwordResetRequestDto),
    authControllers.requestPasswordReset,
  )
  .patch(
    "/update-password",
    validate.dto(authDto.passwordUpdateDto),
    authControllers.updatePassword,
  );
