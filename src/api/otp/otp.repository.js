import { OtpModel } from "./otp.model.js";

export const otpRepository = {
  createOtp: ({ otpHash, userId, expiresAt }) =>
    OtpModel.create({
      otpHash,
      userId,
      expiresAt,
    }),

  findOtpByUserId: (userId) => OtpModel.find({ userId }),
  consumeOtp: (id, userId) =>
    OtpModel.findOneAndDelete({
      _id: id,
      userId,
      expiresAt: { $gt: new Date() },
    }),
  deleteOtp: (id) => OtpModel.findByIdAndDelete(id),
};
