
'use client';
import React, { useEffect, useState } from 'react';
import QuestionRenderer from '@/components/QuestionRenderer';
import { useRouter } from 'next/navigation';

// app/survey/page.tsx

type Option = { id: string; label: string; value: string };

// Change this Question type so qtype is a union, not string:
type Question = {
  id: string;
  code: string;
  section: string;
  prompt: string;
  qtype: 'text' | 'number' | 'single' | 'multi' | 'longtext';
  options?: Option[];
};

type SurveyPayload = {
  survey: { id: string; title: string; description?: string };
  questions: Question[];
};


export default function SurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SurveyPayload | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [inst, setInst] = useState<any>({}); // institution fields
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/survey');
      const js = await res.json();
      if (!res.ok) { setError(js.error || 'Failed to load survey'); setLoading(false); return; }
      setData(js);
      setLoading(false);
    })();
  }, []);

  const setVal = (k: string, v: any) => setValues(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!data) return;
    setError(null);
    // Build answers payload
    const answers: any[] = [];
    for (const q of data.questions) {
      if (q.qtype === 'single') {
        const optId = values[q.id];
        if (optId) {
          answers.push({ question_id: q.id, option_id: optId });
          const otherSel = values[q.id + '_other_sel'];
          if (otherSel && values[q.id + '_other_text']) {
            answers.push({ question_id: q.id, value_text: values[q.id + '_other_text'] });
          }
        }
      } else if (q.qtype === 'multi') {
        const arr: string[] = values[q.id] || [];
        arr.forEach(oid => answers.push({ question_id: q.id, option_id: oid }));
        if (values[q.id + '_other_sel'] && values[q.id + '_other_text']) {
          answers.push({ question_id: q.id, value_text: values[q.id + '_other_text'] });
        }
      } else if (q.qtype === 'text' || q.qtype === 'longtext') {
        const t = values[q.id];
        if (t) answers.push({ question_id: q.id, value_text: String(t) });
      } else if (q.qtype === 'number') {
        const n = values[q.id];
        if (n !== undefined && n !== null && n !== '') answers.push({ question_id: q.id, value_number: Number(n) });
      }
    }

    // Map institution fields from Q1..Q6 as well
    const institution = {
      name: values[data.questions.find(q => q.code==='Q1')?.id || ''] || inst.name,
      country: values[data.questions.find(q => q.code==='Q2')?.id || ''] || inst.country,
      employees_total: Number(values[data.questions.find(q => q.code==='Q3')?.id || ''] || 0),
      employees_it: Number(values[data.questions.find(q => q.code==='Q4')?.id || ''] || 0),
      employees_it_audit: Number(values[data.questions.find(q => q.code==='Q5')?.id || ''] || 0),
      has_ai_unit: (() => {
        const q6 = data.questions.find(q => q.code==='Q6');
        const oid = q6 ? values[q6.id] : null;
        const opt = q6?.options?.find(o => o.id === oid);
        return opt?.value === 'yes' ? true : (opt?.value === 'no' ? false : null);
      })()
    };

    const token = new URLSearchParams(window.location.search).get('t') || null;

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survey_id: data.survey.id, answers, institution, token })
    });
    const js = await res.json();
    if (!res.ok) { setError(js.error || 'Failed to submit'); return; }
    router.push('/thank-you');
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{data.survey.title}</h1>
      <p className="text-sm text-gray-600 mb-6">All data will remain confidential.</p>

      <QuestionRenderer questions={data.questions} values={values} onChange={setVal} />

      <div className="mt-8">
        <button onClick={submit} className="px-4 py-2 bg-black text-white rounded">Submit</button>
      </div>
    </div>
  );
}
