'use client';

export default function GlobalError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <html>
      <body style={{ padding: 16, fontFamily: 'system-ui' }}>
        <h2>Something went wrong</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String((error as any)?.message ?? error)}</pre>
        <button onClick={() => reset()} style={{ padding: 8, marginTop: 8 }}>Try again</button>
      </body>
    </html>
  );
}
