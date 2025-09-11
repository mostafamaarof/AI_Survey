// app/api/debug/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getAdminClient();
  const { data: all, error } = await supabase
    .from('surveys')
    .select('id, title, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const active = all?.find(s => s.is_active) || null;
  return NextResponse.json({
    env: {
      urlHost: (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host; } catch { return null; } })(),
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      surveyIdEnv: process.env.SURVEY_ID || null
    },
    counts: { surveys: all?.length ?? 0 },
    activeSurvey: active,
    newestSurvey: all?.[0] || null
  });
}
