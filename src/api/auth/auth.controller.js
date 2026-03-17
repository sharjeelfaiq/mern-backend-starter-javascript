import { env } from "#config/env.config.js";
import { authService } from "./auth.service.js";
import { handlePromise } from "#lib/promise.lib.js";
import { getCookieOptions } from "#lib/cookie.lib.js";

const { COOKIE_NAME } = env;

export const authController = {
  signup: handlePromise(async (req, res) => {
    const requestBody = req.body;
    const responseBody = await authService.signup(requestBody);
    res.status(201).json(responseBody);
  }),

  signin: handlePromise(async (req, res) => {
    const requestBody = req.body;
    const responseBody = await authService.signin(requestBody);
    const { token } = result;

    const options = getCookieOptions(payload.isRemembered);

    res
      .status(200)
      .cookie(COOKIE_NAME, token, { ...options, maxAge: undefined })
      .json({ ...responseBody, token: undefined });
  }),

  signOut: handlePromise(async (req, res) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) res.status(400).json({ message: "No token found" });

    const responseBody = await authService.signOut(token);

    const options = getCookieOptions(false);
    res.clearCookie(COOKIE_NAME, {
      ...options,
      maxAge: undefined,
    });

    res.status(200).json(responseBody);
  }),

  resetPassword: handlePromise(async (req, res) => {
    const requestBody = req.body;
    const responseBody = await authService.resetPassword(requestBody);
    res.status(200).json(responseBody);
  }),
};
