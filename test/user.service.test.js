import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { userRepository } from "#api/user/user.repository.js";
import { userService } from "#api/user/user.service.js";

afterEach(() => mock.restoreAll());

test("getAll returns users and 404s when there are none", async () => {
  const find = mock.method(userRepository, "findAllUsers", async () => [
    { _id: "1" },
  ]);
  assert.equal((await userService.getAll()).data.length, 1);

  find.mock.mockImplementation(async () => []);
  await assert.rejects(userService.getAll(), { status: 404 });
});

test("getById returns the user or 404s", async () => {
  const find = mock.method(userRepository, "findUserById", async () => ({
    _id: "1",
  }));
  assert.equal((await userService.getById({ id: "1" })).data._id, "1");

  find.mock.mockImplementation(async () => null);
  await assert.rejects(userService.getById({ id: "1" }), { status: 404 });
});

test("updateById rejects protected fields before touching the database", async () => {
  const find = mock.method(userRepository, "findUserById", async () => ({}));
  for (const field of ["password", "email", "isEmailVerified"]) {
    await assert.rejects(userService.updateById("1", { [field]: "x" }), {
      status: 400,
    });
  }
  assert.equal(find.mock.callCount(), 0);
});

test("updateById 404s for a missing user", async () => {
  mock.method(userRepository, "findUserById", async () => null);
  await assert.rejects(userService.updateById("1", { firstName: "A" }), {
    status: 404,
  });
});

test("updateById persists only editable fields and the uploaded avatar", async () => {
  mock.method(userRepository, "findUserById", async () => ({ _id: "1" }));
  const update = mock.method(
    userRepository,
    "updateUserById",
    async (_, data) => data,
  );

  const result = await userService.updateById(
    "1",
    { firstName: "Ada", lastName: undefined },
    { avatar: [{ path: "https://cdn.test/a.png" }] },
  );

  assert.deepEqual(update.mock.calls[0].arguments, [
    "1",
    { firstName: "Ada", profilePicture: "https://cdn.test/a.png" },
  ]);
  assert.equal(result.message, "User updated successfully");
});

test("updateById reports a failed write", async () => {
  mock.method(userRepository, "findUserById", async () => ({ _id: "1" }));
  mock.method(userRepository, "updateUserById", async () => null);
  await assert.rejects(userService.updateById("1", { firstName: "A" }), {
    status: 500,
  });
});

test("deleteById returns the deleted user or 404s", async () => {
  const del = mock.method(userRepository, "deleteUserById", async () => ({
    _id: "1",
  }));
  assert.equal((await userService.deleteById("1")).data._id, "1");

  del.mock.mockImplementation(async () => null);
  await assert.rejects(userService.deleteById("1"), { status: 404 });
});
