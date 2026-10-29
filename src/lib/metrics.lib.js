import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "#config/env.config.js";

const startedAt = Date.now();
const requests = new Map();
const methods = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const requestMetrics = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.once("finish", () => {
    const method = methods.has(req.method) ? req.method : "OTHER";
    const path =
      typeof req.route?.path === "string"
        ? `${req.baseUrl}${req.route.path}`
        : "<unmatched>";
    const status = res.statusCode;
    const key = JSON.stringify([method, path, status]);
    const series = requests.get(key) ?? {
      method,
      route: path,
      status,
      count: 0,
      totalDurationMs: 0,
    };
    series.count += 1;
    series.totalDurationMs += Number(process.hrtime.bigint() - start) / 1e6;
    requests.set(key, series);
  });
  next();
};

const isAuthorized = (authorization) => {
  if (!env.METRICS_TOKEN || typeof authorization !== "string") return false;
  const match = /^Bearer (\S+)$/.exec(authorization);
  if (!match) return false;
  const expected = createHash("sha256").update(env.METRICS_TOKEN).digest();
  const supplied = createHash("sha256").update(match[1]).digest();
  return timingSafeEqual(expected, supplied);
};

const getMetrics = (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!env.METRICS_TOKEN) return res.sendStatus(404);
  if (!isAuthorized(req.get("authorization"))) return res.sendStatus(401);

  const series = [...requests.values()].map((item) => ({ ...item }));
  res.json({
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    requests: series,
    errors: {
      client: series
        .filter((item) => item.status >= 400 && item.status < 500)
        .reduce((total, item) => total + item.count, 0),
      server: series
        .filter((item) => item.status >= 500)
        .reduce((total, item) => total + item.count, 0),
    },
  });
};

export { requestMetrics, getMetrics };
