import { OTPModel } from "#models/otp.model.js";

export const otpRepository = {
  read: {
    otp: async (id) => {
      return await OTPModel.find({ id }).sort({ createdAt: -1 }).limit(1);
    },
  },

  write: {
    otp: async (data) => {
      const { id, otpHash, expiresAt } = data;

      return await OTPModel.create({
        id,
        otpHash,
        expiresAt,
      });
    },
  },
};
