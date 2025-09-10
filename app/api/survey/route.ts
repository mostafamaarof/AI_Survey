
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getAdminClient();

  // Pick selected survey or the latest active
  const surveyId = process.env.SURVEY_ID || null;

  let surveyQuery = supabase.from('surveys').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1);
  if (surveyId) surveyQuery = supabase.from('surveys').select('*').eq('id', surveyId).limit(1);
  const { data: surveys, error: sErr } = await surveyQuery;

  if (sErr || !surveys || surveys.length === 0) {
    return NextResponse.json({ error: sErr?.message || 'No active survey' }, { status: 404 });
  }
  const survey = surveys[0];

  const { data: questions, error: qErr } = await supabase
    .from('questions').select('*').eq('survey_id', survey.id).order('order_index');

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

  const qids = questions.map(q => q.id);
  const { data: options, error: oErr } = await supabase
    .from('question_options').select('*').in('question_id', qids).order('order_index');

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 });

  const byQ = new Map<string, any[]>();
  options?.forEach(opt => {
    if (!byQ.has(opt.question_id)) byQ.set(opt.question_id, []);
    byQ.get(opt.question_id)!.push(opt);
  });

  const payload = {
    survey,
    questions: questions.map(q => ({ ...q, options: byQ.get(q.id) || [] }))
  };

  return NextResponse.json(payload);
}
