import Joi from "joi";

import {
  emailValidation,
  passwordValidation,
  roleValidation,
  tokenValidation,
} from "#utils/validations.utils.js";

export const authDto = {
  signUpDto: Joi.object({
    email: emailValidation.required(),
    password: passwordValidation.required(),
    role: roleValidation.required(),
  }),

  signInDto: Joi.object({
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
