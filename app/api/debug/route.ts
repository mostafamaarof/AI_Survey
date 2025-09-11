import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Debug endpoint is working",
    time: new Date().toISOString()
  });
}
