// app/api/survey/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getAdminClient();

  // Try SURVEY_ID if set
  const surveyId = process.env.SURVEY_ID || null;
  let survey: any = null;

  if (surveyId) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .limit(1);
    if (!error && data && data.length) survey = data[0];
  }

  // Fallback to the active survey
  if (!survey) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length) survey = data[0];
  }

  if (!survey) {
    return NextResponse.json({ error: 'No active survey' }, { status: 404 });
  }

  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', survey.id)
    .order('order_index');

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

  const qids = questions.map(q => q.id);
  const { data: options, error: oErr } = await supabase
    .from('question_options')
    .select('*')
    .in('question_id', qids)
    .order('order_index');

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 });

  const byQ = new Map<string, any[]>();
  (options || []).forEach(opt => {
    if (!byQ.has(opt.question_id)) byQ.set(opt.question_id, []);
    byQ.get(opt.question_id)!.push(opt);
  });

  return NextResponse.json({
    survey,
    questions: questions.map(q => ({ ...q, options: byQ.get(q.id) || [] })),
  });
}
