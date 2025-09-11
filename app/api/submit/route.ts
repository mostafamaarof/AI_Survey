
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const body = await req.json();

  const { institution, answers, survey_id, token } = body || {};
  if (!survey_id || !answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
  }

  // Optional token validation
  if (token) {
    const { data: tok, error: tErr } = await supabase
      .from('invite_tokens').select('*').eq('token', token).single();
    if (tErr || !tok || tok.used_at || tok.survey_id !== survey_id) {
      return NextResponse.json({ error: 'Invalid or used token' }, { status: 400 });
    }
  }

  // Insert institution row (can also upsert by name+country)
  let institution_id: string | null = null;
  if (institution && institution.name) {
    const { data: inst } = await supabase
      .from('institutions')
      .insert({
        name: institution.name,
        country: institution.country || null,
        employees_total: institution.employees_total ?? null,
        employees_it: institution.employees_it ?? null,
        employees_it_audit: institution.employees_it_audit ?? null,
        has_ai_unit: institution.has_ai_unit ?? null
      })
      .select().single();
    institution_id = inst?.id ?? null;
  }

  // Create respondent
  const ip = req.headers.get('x-forwarded-for');
  const ua = req.headers.get('user-agent');
  const { data: resp, error: rErr } = await supabase.from('respondents')
    .insert({ survey_id, institution_id, ip_inferred: ip, user_agent: ua, token })
    .select().single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

  // Bulk insert answers
  const rows = answers.map((a: any) => ({
    respondent_id: resp.id,
    question_id: a.question_id,
    option_id: a.option_id || null,
    value_text: a.value_text || null,
    value_number: a.value_number ?? null
  }));

  const { error: aErr } = await supabase.from('answers').insert(rows);
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

  if (token) {
    await supabase.from('invite_tokens').update({ used_at: new Date().toISOString() }).eq('token', token);
  }

  return NextResponse.json({ ok: true });
}
