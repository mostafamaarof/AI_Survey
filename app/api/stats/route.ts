// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getAdminClient();

  // 1) Pick the active survey (or SURVEY_ID if provided)
  const surveyId = process.env.SURVEY_ID || null;
  let survey: any = null;

  try {
    if (surveyId) {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .limit(1);
      if (error) throw error;
      survey = data?.[0] ?? null;
    } else {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      survey = data?.[0] ?? null;
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load survey' }, { status: 500 });
  }

  if (!survey) return NextResponse.json({ error: 'No survey' }, { status: 404 });

  // 2) Totals + breakdowns with safe fallbacks
  let responsesCount = 0;
  let q7Breakdown: any[] = [];

  try {
    const { data, error } = await supabase.rpc('count_responses', { s_id: survey.id }).single();
    if (error) throw error;
    responsesCount = Number(data?.count ?? 0);
  } catch {
    responsesCount = 0;
  }

  try {
    const { data, error } = await supabase.rpc('breakdown_single_choice', { question_code: 'Q7' });
    if (error) throw error;
    q7Breakdown = Array.isArray(data) ? data : [];
  } catch {
    q7Breakdown = [];
  }

  return NextResponse.json({
    survey,
    totals: { responses: responsesCount },
    q7_breakdown: q7Breakdown,
  });
}
