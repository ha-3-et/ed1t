// app/api/x/route.js
import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const profile = params.get("profile")?.trim();
  const token =
    profile === "ha"
      ? process.env.HA_X_BEARER_TOKEN || process.env.X_BEARER_TOKEN
      : process.env.X_BEARER_TOKEN;
  const requestedUserId = params.get("userId")?.trim();
  const requestedUsername = params.get("username")?.trim().replace(/^@/, "");
  const username = requestedUsername || process.env.X_USERNAME || "";
  let userId = requestedUserId || process.env.X_USER_ID;

  // 日付フォーマット関数 (yyyy.mm.dd)
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  // モックデータを定義
  const fallbackData = [
    {
      type: "LATEST TWEET",
      text: "😿",
      date: formatDate(new Date()),
      url: userId
        ? `https://x.com/i/user/${userId}`
        : username
          ? `https://x.com/${username}`
          : "https://x.com/",
      likes: 3,
    },
    {
      type: "LATEST TWEET",
      text: "😢",
      date: formatDate(new Date()),
      url: userId
        ? `https://x.com/i/user/${userId}`
        : username
          ? `https://x.com/${username}`
          : "https://x.com/",
      likes: 2,
    },
  ];

  // 設定がない場合はモックデータを返す
  if (!token || (!userId && !username)) {
    return NextResponse.json(fallbackData);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    if (!userId && username) {
      const userRes = await fetch(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          next: { revalidate: 86400 },
        },
      );

      if (!userRes.ok) {
        const errorText = await userRes.text();
        console.error(
          `X User Lookup Error (Status: ${userRes.status}) - Fallback to mock data`,
          errorText,
        );
        return NextResponse.json(fallbackData);
      }

      const userData = await userRes.json();
      userId = userData.data?.id;
      if (!userId) return NextResponse.json(fallbackData);
    }

    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&exclude=retweets,replies&tweet.fields=created_at,public_metrics,referenced_tweets`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        next: { revalidate: 86400 },
      },
    );

    clearTimeout(timeoutId);

    // エラーが返ってきた場合はモックデータを返す
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `X API Error (Status: ${res.status}) - Fallback to mock data`,
        errorText,
      );
      return NextResponse.json(fallbackData);
    }

    const data = await res.json();
    if (!data.data) return NextResponse.json(fallbackData);

    // 引用リツイートを除外
    const originalTweets = data.data.filter((tweet) => {
      if (!tweet.referenced_tweets) return true;
      return !tweet.referenced_tweets.some((ref) => ref.type === "quoted");
    });

    // 最新の2件を取得して整形
    const tweets = originalTweets.slice(0, 2).map((tweet) => ({
      type: "LATEST TWEET",
      text: tweet.text,
      date: formatDate(tweet.created_at),
      url: username
        ? `https://x.com/${username}/status/${tweet.id}`
        : `https://x.com/i/web/status/${tweet.id}`,
      likes: tweet.public_metrics?.like_count || 0, // ★いいね数を追加
    }));

    return NextResponse.json(tweets.length > 0 ? tweets : fallbackData);
  } catch (error) {
    console.error("X Fetch Error - Fallback to mock data:", error);
    // 通信エラーなどの場合もモックデータを返す
    return NextResponse.json(fallbackData);
  }
}
