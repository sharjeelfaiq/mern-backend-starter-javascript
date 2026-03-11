import mongoose from "mongoose";
import createError from "http-errors";

import { UserModel } from "#models/user.model.js";

const { isValidObjectId } = mongoose;

export const userRepository = {
  read: {
    users: () => {
      return UserModel.find().exec();
    },

    userByEmail: (email) => {
      return UserModel.findOne({ email }).exec();
    },

    userById: (id) => {
      if (!isValidObjectId(id)) {
        throw createError(400, "Invalid user ID format.");
      }

      return UserModel.findById(id).exec();
    },
  },

  write: {
    user: (data) => {
      const { email, password, role } = data;

      return UserModel.create({ email, password, role });
    },
  },

  update: {
    userById: (data) => {
      const { id, userData } = data;

      if (!isValidObjectId(id)) {
        throw createError(400, "Invalid user ID format.");
      }

      return UserModel.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      });
    },
  },

  remove: {
    userById: (id) => {
      if (!isValidObjectId(id)) {
        throw createError(400, "Invalid user ID format.");
      }

      return UserModel.findByIdAndDelete(id).exec();
    },
  },
};
