import createError from "http-errors";

import { handlePromise } from "#lib/promise.lib.js";

const validateDto = (schema) =>
  handlePromise(async (req, res, next) => {
    // Express 5 leaves req.body undefined when no body was parsed; Joi would accept that.
    const { value, error } = schema.validate(req.body ?? {}, {
      abortEarly: false,
    });
    if (error) {
      const errorMessages = error.details.map(({ message }) => message);
      throw createError(400, `Validation failed: ${errorMessages.join(", ")}`);
    }
    req.body = value;
    next();
  });

export { validateDto };
