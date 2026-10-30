import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { NotificationModel } from "#api/notification/notification.model.js";
import { notificationRepository } from "#api/notification/notification.repository.js";

afterEach(() => mock.restoreAll());

test("getByUserId queries the user's notifications newest first", async () => {
  const rows = [{ _id: "n1" }];
  const exec = mock.fn(async () => rows);
  const sort = mock.fn(() => ({ exec }));
  const find = mock.method(NotificationModel, "find", () => ({ sort }));

  const result = await notificationRepository.getByUserId("user-1");

  assert.deepEqual(find.mock.calls[0].arguments, [{ user: "user-1" }]);
  assert.deepEqual(sort.mock.calls[0].arguments, [{ createdAt: -1 }]);
  assert.equal(result, rows);
});

test("create maps userId onto the user field", async () => {
  const create = mock.method(NotificationModel, "create", async (doc) => doc);

  const result = await notificationRepository.create({
    userId: "user-1",
    message: "hello",
  });

  assert.deepEqual(create.mock.calls[0].arguments[0], {
    user: "user-1",
    message: "hello",
  });
  assert.equal(result.message, "hello");
});

test("updateReadStatus scopes the update to the owner and returns the new document", async () => {
  const updated = { _id: "n1", read: true };
  const update = mock.method(NotificationModel, "findOneAndUpdate", () => ({
    exec: async () => updated,
  }));

  const result = await notificationRepository.updateReadStatus({
    notificationId: "n1",
    userId: "user-1",
    read: true,
  });

  assert.deepEqual(update.mock.calls[0].arguments, [
    { _id: "n1", user: "user-1" },
    { $set: { read: true } },
    { new: true, runValidators: true },
  ]);
  assert.equal(result, updated);
});
