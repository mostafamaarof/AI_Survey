// app/api/env-check/route.ts
export const dynamic = 'force-dynamic';
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const host = (() => { try { return new URL(url).host; } catch { return null; } })();
  return new Response(JSON.stringify({
    supabaseUrlHost: host,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    surveyIdEnv: process.env.SURVEY_ID || null,
  }), { headers: { 'content-type': 'application/json' } });
}
