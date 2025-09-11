// app/survey/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import QuestionRenderer from '@/components/QuestionRenderer';
import Link from 'next/link';

type Option = { id: string; label: string; value: string };
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
  const [data, setData] = useState<SurveyPayload | null>(null);
  const [values, setVal] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/survey', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    })();
  }, []);

  // all questions are required
  const requiredCodes = useMemo(() => new Set<string>(data?.questions.map(q => q.code) ?? []), [data]);

  const countAnswered = useMemo(() => {
    if (!data) return 0;
    let c = 0;
    for (const q of data.questions) {
      const ok = isAnswered(q, values);
      if (ok) c++;
    }
    return c;
  }, [data, values]);

  const totalRequired = data?.questions.length ?? 0;
  const progress = totalRequired ? Math.round((countAnswered / totalRequired) * 100) : 0;

  function isAnswered(q: Question, vals: Record<string, any>) {
    const v = vals[q.code];
    if (q.qtype === 'text' || q.qtype === 'longtext') {
      return typeof v === 'string' && v.trim().length > 0;
    }
    if (q.qtype === 'number') {
      return v !== null && v !== undefined && v !== '';
    }
    if (q.qtype === 'single') {
      if (!v) return false;
      // if 'other' selected, the companion text is required
      const hasOther = q.options?.some(o => o.value === 'other');
      if (hasOther && v === 'other') {
        return typeof vals[`${q.code}_other`] === 'string' && vals[`${q.code}_other`].trim().length > 0;
      }
      return true;
    }
    if (q.qtype === 'multi') {
      if (!Array.isArray(v) || v.length === 0) return false;
      // if includes 'other', require companion text
      if (v.includes('other')) {
        return typeof vals[`${q.code}_other`] === 'string' && vals[`${q.code}_other`].trim().length > 0;
      }
      return true;
    }
    return false;
  }

  function validateAll(): boolean {
    if (!data) return false;
    const next: Record<string, string | null> = {};
    for (const q of data.questions) {
      if (!requiredCodes.has(q.code)) continue;
      if (!isAnswered(q, values)) {
        next[q.code] = 'This question is required.';
      } else {
        next[q.code] = null;
      }
    }
    setErrors(next);
    return Object.values(next).every((e) => !e);
  }

  async function submit() {
    if (!data) return;
    if (!validateAll()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      // convert current values into the API payload shape (answers[])
      const answers = [];
      for (const q of data.questions) {
        const v = values[q.code];
        if (q.qtype === 'single') {
          const opt = q.options?.find(o => o.value === v);
          answers.push({
            question_id: q.id,
            option_id: opt?.id || null,
            value_text: v === 'other' ? (values[`${q.code}_other`] || '') : null,
            value_number: null,
          });
        } else if (q.qtype === 'multi') {
          const arr: string[] = Array.isArray(v) ? v : [];
          for (const val of arr) {
            const opt = q.options?.find(o => o.value === val);
            answers.push({
              question_id: q.id,
              option_id: opt?.id || null,
              value_text: val === 'other' ? (values[`${q.code}_other`] || '') : null,
              value_number: null,
            });
          }
        } else if (q.qtype === 'number') {
          answers.push({
            question_id: q.id,
            option_id: null,
            value_text: null,
            value_number: typeof v === 'number' ? v : Number(v),
          });
        } else {
          // text / longtext
          answers.push({
            question_id: q.id,
            option_id: null,
            value_text: v || '',
            value_number: null,
          });
        }
      }

      const institution = {
        name: values['Q1'] || null,
        country: values['Q2'] || null,
        employees_total: values['Q3'] ?? null,
        employees_it: values['Q4'] ?? null,
        employees_it_audit: values['Q5'] ?? null,
        has_ai_unit: values['Q6'] ? (values['Q6'] === 'yes') : null,
      };

      const token = new URLSearchParams(window.location.search).get('t');

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          survey_id: data.survey.id,
          institution,
          answers,
          token,
        }),
      });

      if (res.ok) {
        window.location.href = '/thank-you';
      } else {
        const j = await res.json().catch(() => ({}));
        alert('Submit failed: ' + (j.error || res.statusText));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="h-2 w-full animate-pulse rounded bg-gray-200" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-rose-600">No active survey.</p>
          <p className="text-sm text-gray-600 mt-2">
            If you are the admin, ensure one survey is <code>is_active = true</code>.
          </p>
          <Link className="text-blue-600 underline mt-4 inline-block" href="/">Go home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-semibold">{data.survey.title}</h1>
        {data.survey.description && (
          <p className="text-sm text-gray-600 mt-2">{data.survey.description}</p>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{countAnswered} of {totalRequired} answered</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-black transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">All questions are required.</p>
      </div>

      {/* Questions */}
      <div className="mt-6">
        <QuestionRenderer
          questions={data.questions}
          values={values}
          errors={errors}
          onChange={(code, v) => {
            setVal((prev) => ({ ...prev, [code]: v }));
            // clear error as user types
            setErrors((e) => ({ ...e, [code]: null }));
          }}
        />
      </div>

      {/* Sticky submit bar (mobile-friendly) */}
      <div className="sticky bottom-0 left-0 right-0 mt-10 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-3xl p-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {progress === 100 ? 'Ready to submit' : 'Please answer all questions'}
          </div>
          <button
            onClick={submit}
            disabled={submitting || progress < 100}
            className={`px-5 py-2 rounded-lg text-white transition
              ${progress < 100 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:opacity-90'}
            `}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </main>
  );
}
