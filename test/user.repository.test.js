import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { UserModel } from "#api/user/user.model.js";
import { userRepository } from "#api/user/user.repository.js";

afterEach(() => mock.restoreAll());

const withSelect = (result) => ({ select: mock.fn(async () => result) });

test("createUser omits username when it is not provided", async () => {
  const create = mock.method(UserModel, "create", async (doc) => doc);

  await userRepository.createUser("Ada", "Lovelace", "a@test.dev", "pw");
  await userRepository.createUser("Ada", "Lovelace", "a@test.dev", "pw", "ada");

  assert.equal("username" in create.mock.calls[0].arguments[0], false);
  assert.equal(create.mock.calls[1].arguments[0].username, "ada");
});

test("read queries exclude the password hash", async () => {
  const query = withSelect([]);
  mock.method(UserModel, "find", () => query);
  mock.method(UserModel, "findById", () => query);

  await userRepository.findAllUsers();
  await userRepository.findUserById("u1");

  assert.deepEqual(query.select.mock.calls[0].arguments, ["-password"]);
  assert.deepEqual(query.select.mock.calls[1].arguments, ["-password"]);
});

test("findUserByEmail looks up by email", async () => {
  const findOne = mock.method(UserModel, "findOne", async () => null);

  await userRepository.findUserByEmail("a@test.dev");

  assert.deepEqual(findOne.mock.calls[0].arguments, [{ email: "a@test.dev" }]);
});

test("findUserByEmailOrUsername only includes the supplied conditions", async () => {
  const findOne = mock.method(UserModel, "findOne", async () => null);

  await userRepository.findUserByEmailOrUsername({ email: "a@test.dev" });
  await userRepository.findUserByEmailOrUsername({ username: "ada" });
  await userRepository.findUserByEmailOrUsername({
    email: "a@test.dev",
    username: "ada",
  });

  assert.deepEqual(findOne.mock.calls[0].arguments[0], {
    $or: [{ email: "a@test.dev" }],
  });
  assert.deepEqual(findOne.mock.calls[1].arguments[0], {
    $or: [{ username: "ada" }],
  });
  assert.equal(findOne.mock.calls[2].arguments[0].$or.length, 2);
});

test("updateUserById validates, returns the new document and hides the password", async () => {
  const query = withSelect({ _id: "u1" });
  const update = mock.method(UserModel, "findByIdAndUpdate", () => query);

  await userRepository.updateUserById("u1", { firstName: "Ada" });

  assert.deepEqual(update.mock.calls[0].arguments, [
    "u1",
    { firstName: "Ada" },
    { new: true, runValidators: true },
  ]);
  assert.deepEqual(query.select.mock.calls[0].arguments, ["-password"]);
});

test("email-keyed updates return the new document", async () => {
  const update = mock.method(UserModel, "findOneAndUpdate", async () => ({}));

  await userRepository.updateUserByEmail("a@test.dev", {
    isEmailVerified: true,
  });
  await userRepository.updateUserPasswordByEmail("a@test.dev", "hash");

  assert.deepEqual(update.mock.calls[0].arguments, [
    { email: "a@test.dev" },
    { isEmailVerified: true },
    { new: true },
  ]);
  assert.deepEqual(update.mock.calls[1].arguments, [
    { email: "a@test.dev" },
    { password: "hash" },
    { new: true },
  ]);
});

test("deleteUserById deletes by id", async () => {
  const del = mock.method(UserModel, "findByIdAndDelete", async () => null);

  await userRepository.deleteUserById("u1");

  assert.deepEqual(del.mock.calls[0].arguments, ["u1"]);
});
