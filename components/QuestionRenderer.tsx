
'use client';
import React from 'react';

type Option = { id: string; label: string; value: string; };
type Question = {
  id: string;
  code: string;
  section: string;
  prompt: string;
  qtype: 'text'|'number'|'single'|'multi'|'longtext';
  options?: Option[];
};

type Props = {
  questions: Question[];
  onChange: (qId: string, value: any) => void;
  values: Record<string, any>;
};

export default function QuestionRenderer({ questions, onChange, values }: Props) {
  const sections = Array.from(new Set(questions.map(q => q.section)));
  return (
    <div className="space-y-8">
      {sections.map(sec => {
        const qs = questions.filter(q => q.section === sec);
        return (
          <div key={sec}>
            <h2 className="text-xl font-semibold mb-4">{sec}</h2>
            <div className="space-y-6">
              {qs.map(q => (
                <div key={q.id}>
                  <label className="block font-medium mb-2">{q.code}. {q.prompt}</label>
                  {q.qtype === 'text' && (
                    <input className="border rounded p-2 w-full" value={values[q.id] ?? ''}
                      onChange={e => onChange(q.id, e.target.value)} />
                  )}
                  {q.qtype === 'number' && (
                    <input type="number" min="0" className="border rounded p-2 w-full" value={values[q.id] ?? ''}
                      onChange={e => onChange(q.id, e.target.value)} />
                  )}
                  {q.qtype === 'longtext' && (
                    <textarea className="border rounded p-2 w-full" rows={4} value={values[q.id] ?? ''}
                      onChange={e => onChange(q.id, e.target.value)} />
                  )}
                  {q.qtype === 'single' && (
                    <div className="space-y-2">
                      {q.options?.map(o => (
                        <label key={o.id} className="flex items-center gap-2">
                          <input type="radio" name={q.id} checked={values[q.id] === o.id}
                            onChange={() => onChange(q.id, o.id)} />
                          <span>{o.label}</span>
                        </label>
                      ))}
                      {/* Show "Other" textbox if an 'Other' option exists and is selected */}
                      {q.options?.some(o => o.value === 'other') && values[q.id+'_other_sel'] && (
                        <input className="border rounded p-2 w-full mt-2" placeholder="Please specify"
                          value={values[q.id+'_other_text'] ?? ''}
                          onChange={e => onChange(q.id+'_other_text', e.target.value)} />
                      )}
                    </div>
                  )}
                  {q.qtype === 'multi' && (
                    <div className="space-y-2">
                      {q.options?.map(o => {
                        const arr: string[] = values[q.id] ?? [];
                        const checked = arr.includes(o.id);
                        return (
                          <label key={o.id} className="flex items-center gap-2">
                            <input type="checkbox" checked={checked}
                              onChange={e => {
                                const copy = new Set(arr);
                                if (e.target.checked) copy.add(o.id); else copy.delete(o.id);
                                onChange(q.id, Array.from(copy));
                                if (o.value === 'other') onChange(q.id+'_other_sel', e.target.checked);
                              }} />
                            <span>{o.label}</span>
                          </label>
                        );
                      })}
                      {q.options?.some(o => o.value === 'other') && values[q.id+'_other_sel'] && (
                        <input className="border rounded p-2 w-full mt-2" placeholder="Please specify"
                          value={values[q.id+'_other_text'] ?? ''}
                          onChange={e => onChange(q.id+'_other_text', e.target.value)} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
