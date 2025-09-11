// components/SurveyWizard.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Option = { id: string; label: string; value: string };
type Question = {
  id: string;
  code: string;
  section: string;
  prompt: string;
  qtype: 'text' | 'number' | 'single' | 'multi' | 'longtext';
  options?: Option[];
};
type Survey = { id: string; title: string; description?: string };

type WizardProps = {
  survey: Survey;
  questions: Question[];
};

type Values = Record<string, any>;
type Errors = Record<string, string | null>;

function isAnswered(q: Question, vals: Values) {
  const v = vals[q.code];
  if (q.qtype === 'text' || q.qtype === 'longtext') {
    return typeof v === 'string' && v.trim().length > 0;
  }
  if (q.qtype === 'number') {
    return v !== null && v !== undefined && v !== '';
  }
  if (q.qtype === 'single') {
    if (!v) return false;
    const hasOther = q.options?.some(o => o.value === 'other');
    if (hasOther && v === 'other') {
      return typeof vals[`${q.code}_other`] === 'string' && vals[`${q.code}_other`].trim().length > 0;
    }
    return true;
  }
  if (q.qtype === 'multi') {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (v.includes('other')) {
      return typeof vals[`${q.code}_other`] === 'string' && vals[`${q.code}_other`].trim().length > 0;
    }
    return true;
  }
  return false;
}

function Field({
  q,
  value,
  onChange,
  error,
}: {
  q: Question;
  value: any;
  onChange: (v: any) => void;
  error?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <label className="block text-base font-medium text-gray-900">
        {q.code}. {q.prompt} <span className="text-rose-600">*</span>
      </label>

      {/* Inputs */}
      <div className="mt-3">
        {q.qtype === 'text' && (
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {q.qtype === 'longtext' && (
          <textarea
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {q.qtype === 'number' && (
          <input
            type="number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        )}

        {q.qtype === 'single' && (
          <div className="grid gap-2">
            {q.options?.map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2 text-base">
                <input
                  type="radio"
                  name={q.code}
                  className="size-4"
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {q.options?.some(o => o.value === 'other') && value === 'other' && (
              <input
                placeholder="Please specify"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
                onChange={(e) => onChange({ _other: e.target.value })}
              />
            )}
          </div>
        )}

        {q.qtype === 'multi' && (
          <div className="grid gap-2">
            {q.options?.map((opt) => {
              const arr: string[] = Array.isArray(value) ? value : [];
              const checked = arr.includes(opt.value);
              return (
                <label key={opt.id} className="inline-flex items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(arr);
                      if (e.target.checked) next.add(opt.value);
                      else next.delete(opt.value);
                      onChange(Array.from(next));
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
            {q.options?.some(o => o.value === 'other') &&
              Array.isArray(value) &&
              value.includes('other') && (
                <input
                  placeholder="Please specify"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black"
                  onChange={(e) => onChange({ _other: e.target.value })}
                />
              )}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export default function SurveyWizard({ survey, questions }: WizardProps) {
  // Build steps by section
  const steps = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      if (!map.has(q.section)) map.set(q.section, []);
      map.get(q.section)!.push(q);
    }
    return Array.from(map.entries()).map(([section, qs]) => ({
      section,
      qs: qs.sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [questions]);

  const totalQuestions = questions.length;

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Progress
  const answered = useMemo(() => {
    let c = 0;
    for (const q of questions) if (isAnswered(q, values)) c++;
    return c;
  }, [questions, values]);
  const progressPct = Math.round((answered / totalQuestions) * 100);

  // Validate current step
  function validateStep(sIdx: number): boolean {
    const stepQs = steps[sIdx].qs;
    const next: Errors = { ...errors };
    let ok = true;
    for (const q of stepQs) {
      const valid = isAnswered(q, values);
      next[q.code] = valid ? null : 'This question is required.';
      if (!valid) ok = false;
    }
    setErrors(next);
    return ok;
  }

  function handleChange(code: string, v: any) {
    // support special {_other} writes for single/multi with other
    if (typeof v === 'object' && v && '_other' in v) {
      setValues(prev => ({ ...prev, [`${code}_other`]: v._other }));
    } else {
      setValues(prev => ({ ...prev, [code]: v }));
      // clear error for this field
      setErrors(prev => ({ ...prev, [code]: null }));
    }
  }

  async function handleSubmit() {
    // final validation (all steps)
    let allOk = true;
    const next: Errors = {};
    for (const q of questions) {
      const valid = isAnswered(q, values);
      next[q.code] = valid ? null : 'This question is required.';
      if (!valid) allOk = false;
    }
    setErrors(next);
    if (!allOk) {
      // jump to first invalid step
      const firstInvalidIdx = steps.findIndex(st => st.qs.some(q => !isAnswered(q, values)));
      if (firstInvalidIdx >= 0) setStep(firstInvalidIdx);
      return;
    }

    setSubmitting(true);
    try {
      // build answers payload
      const answers: any[] = [];
      for (const q of questions) {
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

      const token = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('t')
        : null;

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          survey_id: survey.id,
          institution,
          answers,
          token,
        }),
      });

      if (res.ok) {
        window.location.href = '/thank-you';
      } else {
        const j = await res.json().catch(() => ({} as any));
        alert('Submit failed: ' + (j.error || res.statusText));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Layout: sidebar stepper (desktop) + sticky footer controls
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-semibold">{survey.title}</h1>
        {survey.description && (
          <p className="text-sm text-gray-600 mt-2">{survey.description}</p>
        )}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{answered} of {totalQuestions} answered</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-black transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-6 md:grid-cols-[260px,1fr]">
        {/* Stepper */}
        <aside className="hidden md:block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-fit sticky top-4">
          <ol className="space-y-3">
            {steps.map((s, i) => {
              const allOk = s.qs.every(q => isAnswered(q, values));
              const current = i === step;
              return (
                <li key={s.section}>
                  <button
                    onClick={() => setStep(i)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition
                      ${current ? 'bg-black text-white' : 'hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.section}</span>
                      <span className={`text-[11px] ${allOk ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {s.qs.filter(q => isAnswered(q, values)).length}/{s.qs.length}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Step Content */}
        <section>
          <div className="space-y-5">
            {steps[step].qs.map(q => (
              <Field
                key={q.id}
                q={q}
                value={values[q.code]}
                onChange={(v) => handleChange(q.code, v)}
                error={errors[q.code]}
              />
            ))}
          </div>

          {/* Inline controls (desktop) */}
          <div className="mt-8 hidden md:flex items-center justify-between">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`px-4 py-2 rounded-lg border transition ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => { if (validateStep(step)) setStep((s) => Math.min(steps.length - 1, s + 1)); }}
                className="px-5 py-2 rounded-lg bg-black text-white hover:opacity-90"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-lg bg-black text-white hover:opacity-90"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Sticky controls (mobile) */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 mt-8 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl p-4 flex items-center justify-between gap-3">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`px-4 py-2 rounded-lg border transition ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => { if (validateStep(step)) setStep((s) => Math.min(steps.length - 1, s + 1)); }}
              className="px-5 py-2 rounded-lg bg-black text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-black text-white"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
