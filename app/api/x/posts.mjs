import { Scraper } from "agent-twitter-client";
import { XPostsError } from "./errors.mjs";
import { adaptXResponse, getXWebClient, prepareXRequest, waitForSignal } from "./web-client.mjs";

export { XPostsError } from "./errors.mjs";

export function getXCredentials(profile, env = process.env) {
  const haToken = env.HA_X_AUTH_TOKEN?.trim();
  const haCt0 = env.HA_X_CT0?.trim();
  const useHa = profile === "ha" && Boolean(haToken || haCt0);
  const authToken = useHa ? haToken : env.X_AUTH_TOKEN?.trim();
  const ct0 = useHa ? haCt0 : env.X_CT0?.trim();

  if (!authToken || !ct0 || /[\r\n;]/.test(authToken + ct0)) {
    throw new XPostsError("X_POSTS_NOT_CONFIGURED");
  }

  return { authToken, ct0 };
}

export function normalizePosts(tweets, username) {
  const originals = new Map();
  for (const tweet of tweets) {
    if (
      !tweet.id || tweet.isRetweet || tweet.retweetedStatusId ||
      tweet.isReply || tweet.inReplyToStatusId ||
      tweet.isQuoted || tweet.quotedStatusId
    ) continue;

    const date = tweet.timeParsed
      ? new Date(tweet.timeParsed)
      : new Date(tweet.timestamp * 1000);
    if (Number.isNaN(date.getTime())) continue;

    originals.set(tweet.id, {
      id: tweet.id,
      type: "LATEST TWEET",
      text: tweet.text || "",
      createdAt: date.toISOString(),
      date: new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date).replaceAll("/", "."),
      url: `https://x.com/${username}/status/${tweet.id}`,
      likes: tweet.likes ?? 0,
      replies: tweet.replies ?? 0,
      retweets: tweet.retweets ?? 0,
      views: tweet.views ?? 0,
    });
  }

  // Pinned posts may precede newer posts in the timeline.
  return [...originals.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2);
}

export async function fetchXPosts(
  username,
  credentials,
  {
    createScraper = (options) => new Scraper(options),
    fetchImpl = fetch,
    getWebClient = getXWebClient,
    timeoutMs = 12000,
  } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let upstreamError;

  try {
    const scraper = createScraper({
      fetch: async (input, init = {}) => {
        try {
          const client = await waitForSignal(getWebClient(), controller.signal);
          const { url, headers } = await prepareXRequest(input, init, client);
          const response = await fetchImpl(url, {
            ...init,
            headers,
            cache: "no-store",
            signal: init.signal
              ? AbortSignal.any([init.signal, controller.signal])
              : controller.signal,
          });
          // The client's built-in 429 retry can wait longer than a serverless request.
          if (!response.ok) throw new XPostsError("X_UPSTREAM_ERROR", response.status);
          return new Response(JSON.stringify(adaptXResponse(await response.json())), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          if (error instanceof XPostsError) upstreamError = error;
          throw error;
        }
      },
    });
    await scraper.setCookies([
      `auth_token=${credentials.authToken}; Domain=.twitter.com; Path=/; Secure; HttpOnly`,
      `ct0=${credentials.ct0}; Domain=.twitter.com; Path=/; Secure`,
    ]);

    const profile = await scraper.getProfile(username);
    if (!profile || profile.isPrivate) {
      throw new XPostsError("X_PROFILE_UNAVAILABLE");
    }

    const tweets = [];
    for await (const tweet of scraper.getTweets(username, 20)) {
      tweets.push(tweet);
    }
    return normalizePosts(tweets, username);
  } catch (error) {
    if (controller.signal.aborted) throw new XPostsError("X_FETCH_TIMEOUT");
    if (upstreamError) throw upstreamError;
    if (error instanceof XPostsError) throw error;
    throw new XPostsError("X_FETCH_FAILED");
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
