import Joi from "joi";

import {
  emailValidation,
  passwordValidation,
  roleValidation,
  tokenValidation,
} from "#lib/validations.lib.js";

export const authDto = {
  signupDto: Joi.object({
    email: emailValidation.required(),
    password: passwordValidation.required(),
    role: roleValidation.required(),
  }),

  signinDto: Joi.object({
    email: emailValidation.required(),
    password: passwordValidation.required(),
  }),

  passwordResetRequestDto: Joi.object({
    email: emailValidation.required(),
  }),

  passwordUpdateDto: Joi.object({
    password: passwordValidation.required(),
    resetToken: tokenValidation.required(),
  }),
};
