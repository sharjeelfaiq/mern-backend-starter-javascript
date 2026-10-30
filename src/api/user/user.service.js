import createError from "http-errors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { deleteFile } from "#lib/file.lib.js";
import { userRepository } from "./user.repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @param {{ avatar?: Array<{ path?: string, filename?: string }> } | undefined} files
 * @returns {string | null}
 */
const getUploadedProfilePicture = (files) => {
  const avatar = files?.avatar?.[0];
  if (!avatar) return null;

  return avatar.path ?? avatar.filename ?? null;
};

export const userService = {
  /** @returns {Promise<{ message: string, data: unknown[] }>} */
  getAll: async () => {
    const users = await userRepository.findAllUsers();
    if (!users.length) throw createError(404, "Users not found");
    return {
      message: "Users retrieved successfully",
      data: users,
    };
  },

  /**
   * @param {{ id: string }} params
   * @returns {Promise<{ message: string, data: unknown }>}
   */
  getById: async ({ id }) => {
    const user = await userRepository.findUserById(id);
    if (!user) throw createError(404, "User not found");
    return {
      message: "User retrieved successfully",
      data: user,
    };
  },

  /**
   * Updates only firstName, lastName and username, plus an uploaded avatar.
   * @param {string} id
   * @param {{ firstName?: string, lastName?: string, username?: string }} userData
   * @param {Parameters<typeof getUploadedProfilePicture>[0]} files
   * @returns {Promise<{ message: string, data: unknown }>}
   */
  updateById: async (id, userData, files) => {
    const editableFields = ["firstName", "lastName", "username"];
    if (Object.keys(userData).some((key) => !editableFields.includes(key))) {
      throw createError(400, "Profile contains non-editable fields");
    }
    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) throw createError(404, "User not found");

    const profilePicture = getUploadedProfilePicture(files);
    const updateData = {
      ...Object.fromEntries(
        editableFields
          .filter((key) => userData[key] !== undefined)
          .map((key) => [key, userData[key]]),
      ),
      ...(profilePicture ? { profilePicture } : {}),
    };

    if (updateData.profilePicture && existingUser.profilePicture) {
      const oldProfilePicturePath = path.join(
        __dirname,
        "../../../public",
        existingUser.profilePicture,
      );
      deleteFile(oldProfilePicturePath);
    }

    const updatedUser = await userRepository.updateUserById(id, updateData);
    if (!updatedUser) throw createError(500, "User update failed");

    return {
      message: "User updated successfully",
      data: updatedUser,
    };
  },

  /**
   * @param {string} id
   * @returns {Promise<{ message: string, data: unknown }>}
   */
  deleteById: async (id) => {
    const user = await userRepository.deleteUserById(id);
    if (!user) throw createError(404, "User not found");
    return {
      message: "User deleted successfully",
      data: user,
    };
  },
};
