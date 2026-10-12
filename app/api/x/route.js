import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { X_PROFILES } from "../../config/x-profiles.mjs";
import { fetchXPosts, getXCredentials } from "./posts.mjs";

export const runtime = "nodejs";
export const maxDuration = 30;

const getCachedPosts = unstable_cache(
  async (profile, username) => fetchXPosts(username, getXCredentials(profile)),
  ["agent-twitter-posts-v2"],
  { revalidate: 900 },
);

export async function GET(request) {
  const profile = request.nextUrl.searchParams.get("profile")?.trim() || "main";
  if (!Object.hasOwn(X_PROFILES, profile)) {
    return NextResponse.json([], {
      status: 400,
      headers: { "Cache-Control": "no-store", "X-Posts-Status": "INVALID_PROFILE" },
    });
  }

  try {
    const posts = await getCachedPosts(profile, X_PROFILES[profile].username);
    return NextResponse.json(posts);
  } catch (error) {
    // Log only a fixed code and status; library errors can include session details.
    const code = error.code || "X_FETCH_FAILED";
    console.error(`X posts (${profile}): ${code}`, error.status || "");
    return NextResponse.json([], {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Posts-Status": code },
    });
  }
}
