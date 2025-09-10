
import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">AI Audit Survey</h1>
      <p>Use the links below:</p>
      <ul className="list-disc pl-6">
        <li><Link href="/survey">Survey</Link></li>
        <li><Link href="/admin">Admin</Link></li>
      </ul>
    </main>
  );
}
