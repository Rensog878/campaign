import { NextResponse, type NextRequest } from "next/server";
import { dispatch } from "@/lib/dispatcher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called every few minutes by Vercel Cron or an external scheduler.
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await dispatch());
}

export const GET = handle;
export const POST = handle;
