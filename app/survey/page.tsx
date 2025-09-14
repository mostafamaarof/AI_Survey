// app/survey/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import SurveyWizard from '@/components/SurveyWizard';

type Option = { id: string; label: string; value: string };
type Question = { id: string; code: string; section: string; prompt: string; qtype: 'text' | 'number' | 'single' | 'multi' | 'longtext'; options?: Option[] };
type Survey = { id: string; title: string; description?: string };
type SurveyPayload = { survey: Survey; questions: Question[] };

export default function SurveyPage() {
  const [data, setData] = useState<SurveyPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/survey', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <main className="mx-auto max-w-6xl p-6"><div className="h-2 w-full animate-pulse rounded bg-gray-200" /></main>;
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-rose-600">No active survey.</p>
          <p className="text-sm text-gray-600 mt-2">If you are the admin, ensure one survey is <code>is_active = true</code>.</p>
        </div>
      </main>
    );
  }

  return <SurveyWizard survey={data.survey} questions={data.questions} />;
}
