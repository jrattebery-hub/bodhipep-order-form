'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const BRAND = { bg: '#EAD7BF', green: '#5A7A65', ink: '#2a2a2a', muted: '#5f6a63' };

// Replace with your actual Venmo handle
const VENMO_USER = 'BodhiPep';

function VenmoInner() {
  const sp = useSearchParams();
  const order = sp.get('order') ?? '';
  const total = sp.get('total') ?? '';

  const note = `Order ${order}`;
  const venmoDeep = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(
    VENMO_USER
  )}&amount=${encodeURIComponent(total)}&note=${encodeURIComponent(note)}`;
  const venmoWeb = `https://venmo.com/${encodeURIComponent(
    VENMO_USER
  )}?txn=pay&amount=${encodeURIComponent(total)}&note=${encodeURIComponent(note)}`;

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: BRAND.bg,
        color: BRAND.ink,
        padding: '24px 14px',
      }}
    >
      <style>{`
        .wrap{max-width:500px;margin:0 auto;display:grid;gap:14px}
        .card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.06);padding:20px}
        .hdr{font-size:22px;font-weight:800;color:${BRAND.green}}
        .btn{display:block;width:100%;text-align:center;font-weight:700;padding:14px 16px;border-radius:12px;margin-top:10px;text-decoration:none}
        .btnApp{background:${BRAND.green};color:#fff}
        .btnWeb{background:#000;color:#fff}
        .muted{color:${BRAND.muted};font-size:13px}
      `}</style>

      <div className="wrap">
        <header>
          <div className="hdr">Pay with Venmo</div>
          <div className="muted">
            Order <b>{order || '—'}</b> • Total <b>${total || '—'}</b>
          </div>
        </header>

        <section className="card">
          <a href={venmoDeep} className="btn btnApp">Open in Venmo App</a>
          <a href={venmoWeb} className="btn btnWeb">Pay on Venmo Web</a>
          <p className="muted" style={{ marginTop: 12 }}>
            Put “Order {order}” in the note so we can match your payment.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VenmoInner />
    </Suspense>
  );
}

