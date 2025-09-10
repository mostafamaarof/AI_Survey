
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getAdminClient();

  // Latest survey
  const surveyId = process.env.SURVEY_ID || null;
  let surveyQuery = supabase.from('surveys').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1);
  if (surveyId) surveyQuery = supabase.from('surveys').select('*').eq('id', surveyId).limit(1);
  const { data: surveys } = await surveyQuery;
  const survey = surveys?.[0];
  if (!survey) return NextResponse.json({ error: 'No survey' }, { status: 404 });

  // Get total responses
  const { data: respCount } = await supabase.rpc('count_responses', { s_id: survey.id }).single().catch(() => ({ data: { count: 0 } }));
  // Q7 breakdown (Uses AI)
  const { data: q7 } = await supabase.rpc('breakdown_single_choice', { question_code: 'Q7' }).catch(() => ({ data: [] }));

  return NextResponse.json({
    survey,
    totals: { responses: respCount?.count ?? 0 },
    q7_breakdown: q7 ?? []
  });
}
