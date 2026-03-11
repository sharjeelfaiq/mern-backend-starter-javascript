import mongoose from "mongoose";

import { env } from "#config/env.config.js"; // optional logging
import { logger } from "#config/logger.config.js"; // optional logging
import { passwordUtils } from "#utils/password.utils.js";
import { UserModel } from "#models/user.model.js";

const { DATABASE_URI } = env;

const seedUsers = async () => {
  const users = [
    {
      email: "admin@example.com",
      password: "Admin@1234",
      role: "admin",
      isEmailVerified: true,
    },
    {
      email: "user@example.com",
      password: "User@1234",
      role: "user",
      isEmailVerified: true,
    },
  ];

  for (const user of users) {
    const existing = await UserModel.findOne({ email: user.email });

    if (existing) {
      logger.info(`User already exists: ${user.email}`);
      continue;
    }

    const hashedPassword = await passwordUtils.hash(user.password, {
      rounds: 12,
    });

    await UserModel.create({
      email: user.email,
      password: hashedPassword,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    logger.info(`Created user: ${user.email}`);
  }
};

const main = async () => {
  try {
    await mongoose.connect(DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("Connected to MongoDB");

    await seedUsers();

    logger.info("Seeding complete.");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

main();
