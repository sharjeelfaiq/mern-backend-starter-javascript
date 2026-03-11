import { readFile } from "fs/promises";
import createError from "http-errors";
import { join } from "path";

import { transporter } from "#config/mail.config.js";
import { env } from "#config/env.config.js";
import { VIEWS_DIRECTORY } from "#constants/index.js";

const { USER_EMAIL } = env;

// Template cache for better performance
const templateCache = new Map();

const getEmailTemplate = async (folder, filename) => {
  const cacheKey = `${folder}/${filename}`;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  try {
    const filePath = join(VIEWS_DIRECTORY, folder, filename);
    const template = await readFile(filePath, "utf-8");

    // Cache template for future use
    templateCache.set(cacheKey, template);
    return template;
  } catch (error) {
    throw createError(500, `Failed to read email template: ${error.message}`);
  }
};

const processTemplate = (template, variables) => {
  return Object.entries(variables).reduce(
    (processed, [key, value]) =>
      processed.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value),
    template,
  );
};

const sendMail = async (mailOptions) => {
  try {
    return await transporter.sendMail({
      from: USER_EMAIL,
      ...mailOptions,
    });
  } catch (error) {
    throw createError(500, `Failed to send email: ${error.message}`);
  }
};

// options object should contain the following properties:
// - email
// - resetToken
// - verificationToken
// - FRONTEND_URL
// - BACKEND_URL
// - subject
// - rawOTP

export const sendEmail = async (type, options) => {
  const { email, subject, ...rest } = options;
  const template = await getEmailTemplate(type, "index.html");
  const html = processTemplate(template, rest);

  const supportedTypes = [
    "otp-email",
    "verification-email",
    "verification-notification",
    "reset-password",
  ];

  if (!supportedTypes.includes(type)) {
    throw createError(400, "Invalid email type.");
  }

  if (type === "verification-notification") {
    return html;
  } else {
    return sendMail({
      to: email,
      subject,
      html,
    });
  }
};
