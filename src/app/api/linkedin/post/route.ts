import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important (we need node fetch)
export const dynamic = "force-dynamic";

const LAMBDA_POST_URL =
  process.env.LINKEDIN_POST_URL ||
  "https://kq3qw8hre9.execute-api.ap-south-1.amazonaws.com/default/post";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // draft_id is required
    if (!body?.draft_id) {
      return NextResponse.json(
        { success: false, error: "draft_id is required" },
        { status: 400 }
      );
    }

    // Optional: forward auth if you want (not required in your lambda now)
    // const token = req.headers.get("authorization") || "";

    const upstream = await fetch(LAMBDA_POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: token,
      },
      body: JSON.stringify({ draft_id: body.draft_id }),
    });

    const text = await upstream.text();

    // Try JSON parse, fallback to text
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Proxy failed" },
      { status: 500 }
    );
  }
}