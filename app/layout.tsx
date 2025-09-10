// app/layout.tsx
export const metadata = {
  title: 'AI Audit Survey',
  description: 'Survey on the Use of AI and Digital Technologies in Audit Work',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', margin: 0, fontFamily: 'system-ui, Arial, sans-serif', background: '#f8fafc', color: '#111827' }}>
        {children}
      </body>
    </html>
  );
}
