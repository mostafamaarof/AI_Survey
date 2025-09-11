import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ set" : "❌ missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ set" : "❌ missing",
    SURVEY_ID: process.env.SURVEY_ID || "❌ missing"
  });
}
