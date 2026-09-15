import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  if (!token) {
    return NextResponse.json([
      {
        type: "LATEST POST",
        text: "API Key not configured. (Mock Data)",
        date: formatDate(new Date()),
        url: "https://instagram.com",
        location: "Tokyo, Japan",
      },
    ]);
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,permalink,timestamp,media_type&access_token=${token}&limit=2`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`Failed to fetch from Instagram: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.data) {
      return NextResponse.json([]);
    }

    // 最新2件を整形
    const posts = data.data.map((post) => ({
      type: "LATEST POST",
      text: post.caption || "No caption",
      date: formatDate(post.timestamp),
      url: post.permalink,
      location: null,
    }));

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json([]);
  }
}
