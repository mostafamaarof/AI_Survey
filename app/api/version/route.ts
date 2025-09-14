import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev",
    branch: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
    deployedAt: new Date().toISOString(),
  });
}
