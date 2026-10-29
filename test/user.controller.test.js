import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { userController } from "#api/user/user.controller.js";
import { userService } from "#api/user/user.service.js";

afterEach(() => mock.restoreAll());

const response = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  send() {
    return this;
  },
});

test("user controllers pass request data to services and send expected responses", async () => {
  const list = mock.method(userService, "getAll", async () => ({ data: [] }));
  const get = mock.method(userService, "getById", async () => ({
    data: { id: "one" },
  }));
  const update = mock.method(userService, "updateById", async () => ({
    data: { id: "one" },
  }));
  const remove = mock.method(userService, "deleteById", async () => ({}));
  const next = () => assert.fail("unexpected error");

  const listed = response();
  await userController.getAll({}, listed, next);
  assert.equal(listed.statusCode, 200);
  assert.deepEqual(listed.body, { data: [] });
  assert.equal(list.mock.callCount(), 1);

  const found = response();
  await userController.getById({ params: { id: "one" } }, found, next);
  assert.deepEqual(get.mock.calls[0].arguments, [{ id: "one" }]);
  assert.equal(found.statusCode, 200);

  const changed = response();
  const files = { avatar: [{ path: "avatar.png" }] };
  await userController.updateById(
    { params: { id: "one" }, body: { firstName: "Ada" }, files },
    changed,
    next,
  );
  assert.deepEqual(update.mock.calls[0].arguments, [
    "one",
    { firstName: "Ada" },
    files,
  ]);
  assert.equal(changed.statusCode, 200);

  const deleted = response();
  await userController.deleteById({ params: { id: "one" } }, deleted, next);
  assert.deepEqual(remove.mock.calls[0].arguments, ["one"]);
  assert.equal(deleted.statusCode, 204);
});

test("user controllers forward service errors to Express", async () => {
  const error = new Error("database unavailable");
  mock.method(userService, "getById", async () => {
    throw error;
  });
  let forwarded;
  await userController.getById({ params: { id: "one" } }, response(), (err) => {
    forwarded = err;
  });
  assert.equal(forwarded, error);
});
