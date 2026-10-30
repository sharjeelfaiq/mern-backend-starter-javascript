import "./helpers/env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import Joi from "joi";

import { validateDto } from "#middlewares/validation.middleware.js";

const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).required(),
});

const run = async (body) => {
  const req = { body };
  const errors = [];
  let passed = false;
  await validateDto(schema)(req, {}, (err) => {
    if (err) errors.push(err);
    else passed = true;
  });
  return { req, errors, passed };
};

test("a valid body continues down the chain with the coerced value", async () => {
  const { req, errors, passed } = await run({ email: "a@test.dev", age: "30" });

  assert.equal(passed, true);
  assert.equal(errors.length, 0);
  assert.deepEqual(req.body, { email: "a@test.dev", age: 30 });
});

test("an invalid body is rejected with a 400 listing every problem", async () => {
  const { errors, passed } = await run({ email: "nope", age: 3 });

  assert.equal(passed, false);
  assert.equal(errors[0].status, 400);
  assert.match(errors[0].message, /^Validation failed: /);
  assert.match(errors[0].message, /"email"/);
  assert.match(errors[0].message, /"age"/);
});

test("a missing body is rejected", async () => {
  const { errors } = await run(undefined);

  assert.equal(errors[0].status, 400);
});
