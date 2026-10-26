import multer from "multer";

import { storage } from "#lib/cloudinary.lib.js";
import { env } from "#config/env.config.js";

const formFields = [{ name: "avatar", maxCount: 1 }];

// Add expected dynamic fields (assuming max 10 for safety)
// for (let i = 0; i < 10; i++) {
//   formFields.push({
//     name: `branches[${i}][residenceGuidelines]`,
//     maxCount: 1,
//   }

export const uploadFile = multer({
  storage: env.NODE_ENV === "test" ? multer.memoryStorage() : storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields(formFields);
