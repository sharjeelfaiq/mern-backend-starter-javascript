import { env } from "#config/env.config.js";
import { logger } from "#lib/logger.lib.js";

/**
 * @typedef {object} ErrorContext
 * @property {number} status HTTP status sent to the client.
 * @property {string} [method]
 * @property {string} [path]
 * @property {string} [dsn] ERROR_TRACKING_DSN, empty when not configured.
 */

/** @typedef {(error: Error, context: ErrorContext) => void | Promise<void>} ErrorReporter */

/** @type {ErrorReporter | null} */
let reporter = null;

/**
 * Registers the function that receives server errors, e.g. a Sentry wrapper
 * that reads `context.dsn`. Pass null to remove it. Nothing is sent anywhere
 * until a reporter is registered.
 * @param {ErrorReporter | null} fn
 */
export const setErrorReporter = (fn) => {
  reporter = fn;
};

/**
 * Forwards an error to the registered reporter. A failing reporter is logged
 * and never affects the response.
 * @param {Error} error
 * @param {Omit<ErrorContext, "dsn">} context
 */
export const reportError = async (error, context) => {
  if (!reporter) return;
  try {
    await reporter(error, { ...context, dsn: env.ERROR_TRACKING_DSN });
  } catch (reporterError) {
    logger.error(`Error reporter failed: ${reporterError.message}`);
  }
};
