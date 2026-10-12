import assert from "node:assert/strict";
import test from "node:test";
import { fetchXPosts, getXCredentials, normalizePosts, XPostsError } from "../app/api/x/posts.mjs";
import { adaptXResponse, parseWebClient, prepareXRequest } from "../app/api/x/web-client.mjs";

const credentials = { authToken: "test-auth", ct0: "test-csrf" };
const profileRequest = "https://twitter.com/i/api/graphql/old/UserByScreenName?variables=%7B%7D";
const webClient = {
  bearer: "public-web-client-token",
  operations: new Map([
    ["UserByScreenName", { id: "current-user-id", features: ["profile_flag"], toggles: ["withPayments"] }],
    ["UserTweets", { id: "current-tweets-id", features: ["view_counts_everywhere_api_enabled"], toggles: [] }],
  ]),
  transaction: { generateTransactionId: async () => "signed-request" },
};
const getWebClient = async () => webClient;

test("main and ha use their own complete cookie pairs", () => {
  const env = {
    X_AUTH_TOKEN: " main-auth ", X_CT0: "main-csrf",
    HA_X_AUTH_TOKEN: "ha-auth", HA_X_CT0: "ha-csrf",
  };
  assert.deepEqual(getXCredentials("main", env), { authToken: "main-auth", ct0: "main-csrf" });
  assert.deepEqual(getXCredentials("ha", env), { authToken: "ha-auth", ct0: "ha-csrf" });
  assert.deepEqual(getXCredentials("ha", { X_AUTH_TOKEN: "main-auth", X_CT0: "main-csrf" }), {
    authToken: "main-auth", ct0: "main-csrf",
  });
});

test("missing, partial ha, and malformed credentials are rejected", () => {
  for (const [profile, env] of [
    ["main", {}],
    ["ha", { X_AUTH_TOKEN: "main-auth", X_CT0: "main-csrf", HA_X_AUTH_TOKEN: "ha-auth" }],
    ["main", { X_AUTH_TOKEN: "token; injected=value", X_CT0: "csrf" }],
  ]) {
    assert.throws(() => getXCredentials(profile, env), { code: "X_POSTS_NOT_CONFIGURED" });
  }
});

test("latest two posts are sorted by date, ignoring an older pinned post", () => {
  const posts = normalizePosts([
    { id: "1", isPin: true, text: "pinned", timeParsed: new Date("2026-03-01T00:00:00Z") },
    { id: "2", text: "newest", timeParsed: new Date("2026-10-12T16:00:00Z"), likes: 7 },
    { id: "3", text: "previous", timestamp: Date.parse("2026-10-11T00:00:00Z") / 1000 },
  ], "hahaha_vet");
  assert.deepEqual(posts.map((post) => post.id), ["2", "3"]);
  assert.equal(posts[0].date, "2026.10.13");
  assert.equal(posts[0].url, "https://x.com/hahaha_vet/status/2");
  assert.equal(posts[0].likes, 7);
  assert.equal(posts[1].likes, 0);
});

test("replies, reposts, quotes, invalid dates, and duplicates are excluded", () => {
  const base = { timeParsed: new Date("2026-10-12T00:00:00Z"), text: "post" };
  const posts = normalizePosts([
    { ...base, id: "1", isRetweet: true },
    { ...base, id: "2", isReply: true },
    { ...base, id: "3", isQuoted: true },
    { ...base, id: "4", quotedStatusId: "99" },
    { ...base, id: "5", inReplyToStatusId: "99" },
    { ...base, id: "6", retweetedStatusId: "99" },
    { id: "7", timeParsed: new Date("invalid") },
    { ...base, id: "8" },
    { ...base, id: "8" },
  ], "Ihurah_com");
  assert.deepEqual(posts.map((post) => post.id), ["8"]);
  assert.deepEqual(normalizePosts([], "Ihurah_com"), []);
});

test("cookies authenticate a read-only scraper and preserve the UI response shape", async () => {
  let receivedCookies;
  const posts = await fetchXPosts("hahaha_vet", credentials, {
    createScraper: () => ({
      setCookies: async (cookies) => { receivedCookies = cookies; },
      getProfile: async (username) => {
        assert.equal(username, "hahaha_vet");
        return { isPrivate: false };
      },
      async *getTweets(username, limit) {
        assert.equal(username, "hahaha_vet");
        assert.equal(limit, 20);
        yield { id: "123", text: "real post", timestamp: 1791792000, likes: 10 };
      },
    }),
  });
  assert.equal(receivedCookies.length, 2);
  assert.match(receivedCookies[0], /^auth_token=test-auth;/);
  assert.match(receivedCookies[1], /^ct0=test-csrf;/);
  assert.equal(posts[0].text, "real post");
  assert.equal(posts[0].likes, 10);
  assert.equal(JSON.stringify(posts).includes("test-auth"), false);
});

test("private profiles are not exposed by the public route", async () => {
  await assert.rejects(fetchXPosts("private_user", credentials, {
    createScraper: () => ({
      setCookies: async () => {},
      getProfile: async () => ({ isPrivate: true }),
      getTweets: () => { assert.fail("must not read a private timeline"); },
    }),
  }), { code: "X_PROFILE_UNAVAILABLE" });
});

test("HTTP 429 stops immediately even if the client masks its underlying error", async () => {
  await assert.rejects(fetchXPosts("Ihurah_com", credentials, {
    getWebClient,
    createScraper: ({ fetch }) => ({
      setCookies: async () => {},
      getProfile: async () => {
        await fetch(profileRequest).catch(() => {
          throw new Error("Failed to perform request.");
        });
      },
    }),
    fetchImpl: async () => new Response("rate limited", { status: 429 }),
  }), { code: "X_UPSTREAM_ERROR", status: 429 });
});

test("slow requests are aborted and reported without session details", async () => {
  await assert.rejects(fetchXPosts("Ihurah_com", credentials, {
    timeoutMs: 10,
    getWebClient,
    createScraper: ({ fetch }) => ({
      setCookies: async () => {},
      getProfile: async () => fetch(profileRequest),
    }),
    fetchImpl: async (input, { signal, cache }) => {
      assert.equal(cache, "no-store");
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    },
  }), { code: "X_FETCH_TIMEOUT" });
});

test("library error contents never propagate session secrets", async () => {
  await assert.rejects(fetchXPosts("Ihurah_com", credentials, {
    createScraper: () => ({ setCookies: async () => { throw new Error("test-auth"); } }),
  }), { message: "X_FETCH_FAILED", code: "X_FETCH_FAILED" });
});

test("the installed Scraper sends the configured Cookie and CSRF headers", async () => {
  let requests = 0;
  await assert.rejects(fetchXPosts("Ihurah_com", credentials, {
    getWebClient,
    fetchImpl: async (input, init) => {
      requests++;
      assert.equal(input.hostname, "api.x.com");
      assert.equal(init.headers.get("x-twitter-auth-type"), "OAuth2Session");
      assert.equal(init.headers.get("x-client-transaction-id"), "signed-request");
      assert.match(init.headers.get("cookie"), /auth_token=test-auth/);
      assert.match(init.headers.get("cookie"), /ct0=test-csrf/);
      assert.equal(init.headers.get("x-csrf-token"), "test-csrf");
      return new Response("unauthorized", { status: 401 });
    },
  }), { code: "X_UPSTREAM_ERROR", status: 401 });
  assert.equal(requests, 1);
});

test("the installed Scraper recognizes protected profiles without fetching tweets", async () => {
  let requests = 0;
  await assert.rejects(fetchXPosts("private_user", credentials, {
    getWebClient,
    fetchImpl: async () => {
      requests++;
      return Response.json({ data: { user: { result: {
        rest_id: "123",
        __typename: "User",
        core: {
          screen_name: "private_user",
        },
        privacy: { protected: true },
        avatar: { image_url: "https://example.com/avatar_normal.jpg" },
      } } } });
    },
  }), { code: "X_PROFILE_UNAVAILABLE" });
  assert.equal(requests, 1);
});

test("current operation metadata is parsed without executing downloaded code", () => {
  const bearer = "A".repeat(100);
  const source = `globalThis.__X_SOURCE_EXECUTED = true;
    const bearer = "${bearer}";
    module.exports = { queryId: "new-profile-id", operationName: "UserByScreenName",
      metadata: { featureSwitches: ["profile_flag"], fieldToggles: [] } };
    module.exports = { queryId: "new-posts-id", operationName: "UserTweets",
      metadata: { featureSwitches: ["posts_flag"], fieldToggles: ["withVoice"] } };`;
  const client = parseWebClient(source);
  assert.equal(globalThis.__X_SOURCE_EXECUTED, undefined);
  assert.equal(client.bearer, bearer);
  assert.equal(client.operations.get("UserTweets").id, "new-posts-id");
  assert.throws(() => parseWebClient("const empty = {};"), { code: "X_CLIENT_INCOMPATIBLE" });
});

test("current request uses api.x.com, updated query IDs, complete flags, and a signature", async () => {
  const old = new URL("https://twitter.com/i/api/graphql/outdated/UserTweets");
  old.searchParams.set("variables", JSON.stringify({ userId: "123", count: 20 }));
  old.searchParams.set("features", JSON.stringify({ view_counts_everywhere_api_enabled: true, removed_flag: true }));
  const { url, headers } = await prepareXRequest(old, {
    headers: { cookie: "auth_token=test-auth; ct0=test-csrf", "x-csrf-token": "test-csrf" },
  }, webClient);
  assert.equal(url.origin, "https://api.x.com");
  assert.equal(url.pathname, "/graphql/current-tweets-id/UserTweets");
  assert.equal(JSON.parse(url.searchParams.get("variables")).withV2Timeline, true);
  assert.deepEqual(JSON.parse(url.searchParams.get("features")), { view_counts_everywhere_api_enabled: true });
  assert.equal(headers.get("authorization"), "Bearer public-web-client-token");
  assert.equal(headers.get("x-client-transaction-id"), "signed-request");
  assert.equal(url.href.includes("test-auth"), false);
  await assert.rejects(prepareXRequest("https://example.com/UserTweets", {}, webClient), { code: "X_CLIENT_INCOMPATIBLE" });
});

test("client metadata errors survive the installed scraper's error wrapping", async () => {
  await assert.rejects(fetchXPosts("Ihurah_com", credentials, {
    getWebClient: async () => { throw new XPostsError("X_CLIENT_INCOMPATIBLE"); },
    fetchImpl: async () => { assert.fail("must not fetch with missing metadata"); },
  }), { code: "X_CLIENT_INCOMPATIBLE" });
});

test("modern users and timeline fields are adapted for agent-twitter-client", () => {
  const user = {
    __typename: "User", rest_id: "123",
    core: { screen_name: "Ihurah_com", name: "Ihurah" },
    privacy: { protected: false },
    avatar: { image_url: "https://example.com/avatar.jpg" },
    relationship_counts: { followers: 10, following: 20 },
    timeline: { timeline: { instructions: [] } },
  };
  const body = adaptXResponse({ data: { user: { result: user } } });
  assert.equal(body.data.user.result.legacy.screen_name, "Ihurah_com");
  assert.equal(user.legacy.protected, false);
  assert.equal(user.legacy.followers_count, 10);
  assert.equal(user.timeline_v2, user.timeline);
});

test("installed Scraper parses modern profile and timeline responses end to end", async () => {
  const user = {
    __typename: "User", rest_id: "123",
    core: { screen_name: "compat_fixture_user", name: "Fixture" },
    privacy: { protected: false },
    avatar: { image_url: "https://example.com/avatar_normal.jpg" },
  };
  const posts = await fetchXPosts("compat_fixture_user", credentials, {
    getWebClient,
    fetchImpl: async (input) => {
      if (input.pathname.endsWith("/UserByScreenName")) {
        return Response.json({ data: { user: { result: structuredClone(user) } } });
      }
      const timeline = {
        instructions: [{ type: "TimelineAddEntries", entries: [{
          entryId: "tweet-456",
          content: { itemContent: { tweet_results: { result: {
            __typename: "Tweet", rest_id: "456", core: { user_results: { result: structuredClone(user) } },
            legacy: {
              id_str: "456", full_text: "Current response format", created_at: "Mon Oct 12 16:00:00 +0000 2026",
              favorite_count: 4, reply_count: 0, retweet_count: 0,
              entities: { hashtags: [], user_mentions: [], urls: [] },
            },
          } } } },
        }] }],
      };
      return Response.json({ data: { user: { result: { timeline: { timeline } } } } });
    },
  });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].text, "Current response format");
  assert.equal(posts[0].date, "2026.10.13");
  assert.equal(posts[0].likes, 4);
});
