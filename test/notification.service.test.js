import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { notificationRepository } from "#api/notification/notification.repository.js";
import { notificationService } from "#api/notification/notification.service.js";

afterEach(() => mock.restoreAll());

test("listing returns the requested user's notifications, including an empty list", async () => {
  const find = mock.method(
    notificationRepository,
    "getByUserId",
    async () => [],
  );
  const result = await notificationService.getNotificationsByUserId({
    userId: "owner",
  });
  assert.deepEqual(result.data, []);
  assert.deepEqual(find.mock.calls[0].arguments, ["owner"]);
});

test("listing reports repository failure", async () => {
  mock.method(notificationRepository, "getByUserId", async () => null);
  await assert.rejects(
    notificationService.getNotificationsByUserId({ userId: "owner" }),
    { status: 500 },
  );
});

test("marking read scopes the write to the signed-in owner", async () => {
  const update = mock.method(
    notificationRepository,
    "updateReadStatus",
    async () => ({
      _id: "notice",
      read: true,
    }),
  );
  const result = await notificationService.updateNotificationById(
    { notiId: "notice" },
    "owner",
  );
  assert.equal(result.data.read, true);
  assert.deepEqual(update.mock.calls[0].arguments[0], {
    notificationId: "notice",
    userId: "owner",
    read: true,
  });
});

test("marking a missing or foreign notification read returns 404", async () => {
  mock.method(notificationRepository, "updateReadStatus", async () => null);
  await assert.rejects(
    notificationService.updateNotificationById({ notiId: "foreign" }, "owner"),
    { status: 404 },
  );
});
