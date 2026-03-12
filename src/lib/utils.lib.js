import createError from "http-errors";

export const routeHandler = (fn) => async (request, response, next) => {
  try {
    await fn(request, response, next);
  } catch (error) {
    next(error);
  }
};

export const promiseHandler =
  (fn) =>
  async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      throw createError(500, error.message);
    }
  };

export const parseDelimitedString = (input) => {
  return Array.isArray(input) ? input : input?.split(",").map((s) => s.trim());
};

export const generateUsername = (firstName, lastName) => {
  // Clean and normalize the inputs
  const cleanFirstName = firstName.trim().toLowerCase();
  const cleanLastName = lastName.trim().toLowerCase();

  // Base username: first letter of first name + last name
  let baseUsername = cleanFirstName.charAt(0) + cleanLastName;

  // Remove special characters and spaces
  baseUsername = baseUsername.replace(/[^a-z0-9]/g, "");

  // Add random suffix for uniqueness (4-digit number)
  const randomSuffix = Math.floor(1000 + Math.random() * 900000);

  return baseUsername + randomSuffix;
};
