import { APIResponse, expect, test } from "@playwright/test";

/**
 * API tests for POST https://jsonplaceholder.typicode.com/posts (base URL comes from API_BASE_URL).
 *
 * JSONPlaceholder is a MOCK API: it does not validate input and does not persist data.
 * It is documented to accept almost any POST body and echo it back with a generated id.
 * Therefore these tests do NOT assert 400/422. They assert what matters for a robustness check:
 *   1. the server never fails with a 5xx,
 *   2. the response is well-formed (a JSON object, or a 4xx client error with a body),
 *   3. whatever status/body is returned is captured and attached to the report, so the real observed
 *      behaviour is documented on every run (see test-results/reports/api-html).
 */

const ENDPOINT = "/posts";

interface Observed {
  status: number;
  statusText: string;
  contentType: string;
  rawBody: string;
  json: unknown;
}

async function observe(response: APIResponse): Promise<Observed> {
  const rawBody = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(rawBody);
  } catch {
    json = null;
  }
  return {
    status: response.status(),
    statusText: response.statusText(),
    contentType: response.headers()["content-type"] ?? "",
    rawBody,
    json,
  };
}

async function record(testInfo: import("@playwright/test").TestInfo, name: string, payload: unknown, seen: Observed) {
  const summary = {
    request: payload,
    observed: { status: seen.status, statusText: seen.statusText, contentType: seen.contentType, body: seen.json ?? seen.rawBody },
  };
  await testInfo.attach(`${name}-request-response.json`, { body: JSON.stringify(summary, null, 2), contentType: "application/json" });
  console.log(`[${name}] status=${seen.status} body=${seen.rawBody.slice(0, 200).replace(/\s+/g, " ")}`);
}

/**
 * A response that came from a proxy/firewall rather than from the API is NOT a valid observation.
 * Mark the test as skipped (never as passed) so a blocked network can't produce a false green result.
 */
function skipIfNotFromApi(seen: Observed) {
  const blockedByProxy = /not in allowlist|egress|proxy/i.test(seen.rawBody) && !seen.contentType.includes("json");
  test.skip(blockedByProxy, `Request did not reach jsonplaceholder (HTTP ${seen.status}: ${seen.rawBody.slice(0, 80)}). Run on a machine with internet access.`);
}

function expectNoServerError(seen: Observed) {
  expect(seen.status, `server-side failure: HTTP ${seen.status}`).toBeLessThan(500);
}

test.describe("POST /posts - boundary and invalid data", () => {
  test("accepts or cleanly handles an excessively long title (10,000 chars)", async ({ request }, testInfo) => {
    const longTitle = "A".repeat(10_000);
    const payload = { title: longTitle, body: "boundary test", userId: 1 };

    const response = await request.post(ENDPOINT, { data: payload });
    const seen = await observe(response);
    await record(testInfo, "long-title", { ...payload, title: `"A" x ${longTitle.length}` }, seen);

    skipIfNotFromApi(seen);
    expectNoServerError(seen);
    if (seen.status >= 200 && seen.status < 300) {
      // Mock API echo behaviour: the created resource should come back as a JSON object with an id.
      const body = seen.json as Record<string, unknown>;
      expect(body, "2xx response should be a JSON object").toBeTruthy();
      expect(body).toHaveProperty("id");
      expect(String(body.title ?? "").length, "echoed title length").toBe(longTitle.length);
    } else {
      expect(seen.status, "if rejected it must be a client error").toBeGreaterThanOrEqual(400);
    }
  });

  test("accepts or cleanly handles unsupported / special characters", async ({ request }, testInfo) => {
    const title = `<script>alert("x")</script> ' OR 1=1 -- ñ 日本語 😀 \\u0000 \\n\\t % & ; { }`;
    const payload = { title, body: "special characters test", userId: 1 };

    const response = await request.post(ENDPOINT, { data: payload });
    const seen = await observe(response);
    await record(testInfo, "special-characters", payload, seen);

    skipIfNotFromApi(seen);
    expectNoServerError(seen);
    if (seen.status >= 200 && seen.status < 300) {
      const body = seen.json as Record<string, unknown>;
      expect(body).toHaveProperty("id");
      // The server must not mangle or execute the input: it is echoed back as plain data.
      expect(body.title).toBe(title);
    } else {
      expect(seen.status).toBeGreaterThanOrEqual(400);
    }
  });

  test("accepts or cleanly handles a missing userId", async ({ request }, testInfo) => {
    const payload = { title: "missing userId", body: "no userId in this request" };

    const response = await request.post(ENDPOINT, { data: payload });
    const seen = await observe(response);
    await record(testInfo, "missing-userId", payload, seen);

    skipIfNotFromApi(seen);
    expectNoServerError(seen);
    if (seen.status >= 200 && seen.status < 300) {
      // A mock API is expected to be lenient: it creates the post anyway and must not invent a userId.
      const body = seen.json as Record<string, unknown>;
      expect(body).toHaveProperty("id");
      expect(body.title).toBe(payload.title);
      expect(body.userId, "server should not fabricate a userId").toBeUndefined();
    } else {
      expect(seen.status).toBeGreaterThanOrEqual(400);
    }
  });
});
