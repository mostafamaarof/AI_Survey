// components/QuestionRenderer.tsx
'use client';

import React from 'react';

type Option = { id: string; label: string; value: string };
type Question = {
  id: string;
  code: string;
  section: string;
  prompt: string;
  qtype: 'text' | 'number' | 'single' | 'multi' | 'longtext';
  options?: Option[];
};

type Values = Record<string, any>;
type Errors = Record<string, string | null>;

export default function QuestionRenderer({
  questions,
  values,
  errors,
  onChange,
}: {
  questions: Question[];
  values: Values;
  errors: Errors;
  onChange: (code: string, v: any) => void;
}) {
  // group by section for nicer layout
  const sections = Array.from(
    questions.reduce((m, q) => {
      if (!m.has(q.section)) m.set(q.section, []);
      m.get(q.section)!.push(q);
      return m;
    }, new Map<string, Question[]>())
  );

  return (
    <div className="space-y-8">
      {sections.map(([section, qs]) => (
        <section key={section} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{section}</h2>
          <div className="space-y-6">
            {qs.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  <span className="align-middle">{q.code}. {q.prompt}</span>
                  <span className="text-rose-600 ml-1">*</span>
                </label>

                {q.qtype === 'text' && (
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    value={values[q.code] ?? ''}
                    onChange={(e) => onChange(q.code, e.target.value)}
                  />
                )}

                {q.qtype === 'longtext' && (
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    value={values[q.code] ?? ''}
                    onChange={(e) => onChange(q.code, e.target.value)}
                  />
                )}

                {q.qtype === 'number' && (
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    value={values[q.code] ?? ''}
                    onChange={(e) => onChange(q.code, e.target.value === '' ? '' : Number(e.target.value))}
                  />
                )}

                {q.qtype === 'single' && (
                  <div className="grid gap-2">
                    {q.options?.map((opt) => (
                      <label key={opt.id} className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.code}
                          className="size-4"
                          checked={values[q.code] === opt.value}
                          onChange={() => onChange(q.code, opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                    {/* conditional other text when value === 'other' */}
                    {q.options?.some(o => o.value === 'other') && values[q.code] === 'other' && (
                      <input
                        placeholder="Please specify"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                        value={values[`${q.code}_other`] ?? ''}
                        onChange={(e) => onChange(`${q.code}_other`, e.target.value)}
                      />
                    )}
                  </div>
                )}

                {q.qtype === 'multi' && (
                  <div className="grid gap-2">
                    {q.options?.map((opt) => {
                      const arr: string[] = values[q.code] ?? [];
                      const checked = arr.includes(opt.value);
                      return (
                        <label key={opt.id} className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(arr);
                              if (e.target.checked) next.add(opt.value);
                              else next.delete(opt.value);
                              onChange(q.code, Array.from(next));
                            }}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                    {/* conditional other text when 'other' is selected */}
                    {q.options?.some(o => o.value === 'other') &&
                      Array.isArray(values[q.code]) &&
                      values[q.code].includes('other') && (
                        <input
                          placeholder="Please specify"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                          value={values[`${q.code}_other`] ?? ''}
                          onChange={(e) => onChange(`${q.code}_other`, e.target.value)}
                        />
                      )}
                  </div>
                )}

                {errors[q.code] && (
                  <p className="mt-2 text-sm text-rose-600">{errors[q.code]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
