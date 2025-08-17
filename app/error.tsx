'use client';

export default function Error({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Page error</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{String((error as any)?.message ?? error)}</pre>
      <button onClick={() => reset()} style={{ padding: 8, marginTop: 8 }}>Try again</button>
    </div>
  );
}
