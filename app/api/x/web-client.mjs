import { parse } from "acorn";
import { parseHTML } from "linkedom";
import { ClientTransaction } from "x-client-transaction-id";
import { XPostsError } from "./errors.mjs";

const OPERATIONS = new Set(["UserByScreenName", "UserTweets"]);
const USER_AGENT = "Mozilla/5.0";
let cachedClient;
let expiresAt = 0;

function readStaticValue(node) {
  if (node?.type === "Literal") return node.value;
  if (node?.type === "ArrayExpression") return node.elements.map(readStaticValue);
  if (node?.type === "ObjectExpression") {
    return Object.fromEntries(node.properties
      .filter((property) => property.type === "Property" && !property.computed)
      .map((property) => [property.key.name ?? property.key.value, readStaticValue(property.value)]));
  }
}

export function parseWebClient(source) {
  // Read the public bundle as syntax; never evaluate downloaded JavaScript.
  const stack = [parse(source, { ecmaVersion: "latest", sourceType: "script" })];
  const operations = new Map();
  let bearer;
  while (stack.length) {
    const node = stack.pop();
    if (node.type === "Literal" && typeof node.value === "string" && /^AAAAA[A-Za-z0-9%]{80,}$/.test(node.value)) {
      bearer = node.value;
    }
    if (node.type === "ObjectExpression") {
      const property = node.properties.find((property) => (property.key?.name ?? property.key?.value) === "operationName");
      const name = readStaticValue(property?.value);
      if (OPERATIONS.has(name)) {
        const spec = readStaticValue(node);
        if (typeof spec.queryId === "string" &&
          Array.isArray(spec.metadata?.featureSwitches) &&
          Array.isArray(spec.metadata?.fieldToggles)) {
          operations.set(name, {
            id: spec.queryId,
            features: spec.metadata.featureSwitches,
            toggles: spec.metadata.fieldToggles,
          });
        }
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) stack.push(child);
      } else if (value?.type) stack.push(value);
    }
  }
  if (!bearer || [...OPERATIONS].some((name) => !operations.has(name))) {
    throw new XPostsError("X_CLIENT_INCOMPATIBLE");
  }
  return { bearer, operations };
}

export function waitForSignal(promise, signal) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

async function loadWebClient() {
  const signal = AbortSignal.timeout(12000);
  const page = await fetch("https://x.com/i/jf/", {
    headers: { "User-Agent": USER_AGENT }, cache: "no-store", signal,
  });
  if (!page.ok) throw new XPostsError("X_CLIENT_UNAVAILABLE", page.status);
  const { document } = parseHTML(await page.text());
  const main = [...document.querySelectorAll("script[src]")]
    .map((script) => script.getAttribute("src"))
    .find((src) => /^https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/main\.[a-zA-Z0-9]+\.js$/.test(src));
  if (!main) throw new XPostsError("X_CLIENT_INCOMPATIBLE");
  const bundle = await fetch(main, { cache: "no-store", signal });
  if (!bundle.ok) throw new XPostsError("X_CLIENT_UNAVAILABLE", bundle.status);
  const client = parseWebClient(await bundle.text());
  const transaction = await waitForSignal(ClientTransaction.create(document), signal);
  return { ...client, transaction };
}

export function getXWebClient() {
  if (!cachedClient || Date.now() >= expiresAt) {
    expiresAt = Date.now() + 3600000;
    const pending = loadWebClient().catch((error) => {
      if (cachedClient === pending) cachedClient = undefined;
      throw error;
    });
    cachedClient = pending;
  }
  return cachedClient;
}

export async function prepareXRequest(input, init, client) {
  const original = new URL(input);
  const operation = original.pathname.split("/").at(-1);
  const spec = client.operations.get(operation);
  if (!spec || !["twitter.com", "api.twitter.com", "x.com", "api.x.com"].includes(original.hostname)) {
    throw new XPostsError("X_CLIENT_INCOMPATIBLE");
  }
  const url = new URL(`https://api.x.com/graphql/${spec.id}/${operation}`);
  const variables = JSON.parse(original.searchParams.get("variables") || "{}");
  if (operation === "UserTweets") variables.withV2Timeline = true;
  url.searchParams.set("variables", JSON.stringify(variables));
  for (const [parameter, keys] of [["features", spec.features], ["fieldToggles", spec.toggles]]) {
    const provided = JSON.parse(original.searchParams.get(parameter) || "{}");
    url.searchParams.set(parameter, JSON.stringify(Object.fromEntries(
      keys.map((key) => [key, provided[key] === true]),
    )));
  }
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${client.bearer}`);
  headers.set("x-twitter-auth-type", "OAuth2Session");
  headers.set("x-twitter-active-user", "yes");
  headers.set("User-Agent", USER_AGENT);
  headers.set("x-client-transaction-id", await client.transaction.generateTransactionId(init.method || "GET", url.pathname));
  return { url, headers };
}

export function adaptXResponse(data) {
  const stack = [data];
  const visited = new WeakSet();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    if (value.__typename === "User" && value.core?.screen_name) {
      const legacy = value.legacy || {};
      value.legacy = {
        ...legacy,
        id_str: value.rest_id ?? legacy.id_str,
        screen_name: value.core.screen_name,
        name: value.core.name ?? legacy.name,
        created_at: value.core.created_at ?? legacy.created_at,
        profile_image_url_https: value.avatar?.image_url ?? legacy.profile_image_url_https,
        profile_banner_url: value.banner?.image_url ?? legacy.profile_banner_url,
        protected: value.privacy?.protected ?? legacy.protected,
        description: value.profile_bio?.description ?? legacy.description,
        followers_count: value.relationship_counts?.followers ?? legacy.followers_count,
        friends_count: value.relationship_counts?.following ?? legacy.friends_count,
        statuses_count: value.tweet_counts?.tweets ?? legacy.statuses_count,
        media_count: value.tweet_counts?.media ?? legacy.media_count,
        verified: value.verification?.verified ?? legacy.verified,
      };
    }
    // The scraper still expects timeline_v2, including nested author legacy fields.
    if (value.timeline?.timeline && !value.timeline_v2) value.timeline_v2 = value.timeline;
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") stack.push(child);
    }
  }
  return data;
}
