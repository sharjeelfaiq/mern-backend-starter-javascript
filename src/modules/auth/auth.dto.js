import Joi from "joi";

import {
  emailValidation,
  passwordValidation,
  roleValidation,
  tokenValidation,
} from "#lib/validations.lib.js";

export const signupDto = Joi.object({
  email: emailValidation.required(),
  password: passwordValidation.required(),
  role: roleValidation.required(),
});

export const signinDto = Joi.object({
  email: emailValidation.required(),
  password: passwordValidation.required(),
});

export const passwordResetRequestDto = Joi.object({
  email: emailValidation.required(),
});

export const passwordUpdateDto = Joi.object({
  password: passwordValidation.required(),
  resetToken: tokenValidation.required(),
});
