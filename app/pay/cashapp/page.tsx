'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const BRAND = { bg: '#EAD7BF', green: '#5A7A65', ink: '#2a2a2a', muted: '#5f6a63' };

// Replace with your actual Cash App $cashtag (include the $)
const CASH_TAG = '$BodhiPep';

function CashAppInner() {
  const sp = useSearchParams();
  const order = sp.get('order') ?? '';
  const total = sp.get('total') ?? '';

  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(''), 1200);
  }, [copied]);

  const links = useMemo(() => {
    const tagNoDollar = CASH_TAG.replace(/^\$/, '');
    // Cash App supports amount in URL; memo must be typed by user
    return {
      web: `https://cash.app/${encodeURIComponent(tagNoDollar)}?amount=${encodeURIComponent(total)}`,
      // Some clients handle deep link:
      deep: `cashapp://pay?recipient=${encodeURIComponent(CASH_TAG)}&amount=${encodeURIComponent(total)}`,
    };
  }, [total]);

  const copyOrder = () => {
    navigator.clipboard.writeText(`Order ${order}`).then(
      () => setCopied('Copied'),
      () => setCopied('Could not copy')
    );
  };

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
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .pill{font-size:12px;border:1px solid rgba(0,0,0,.12);padding:6px 10px;border-radius:999px;background:#faf7f1}
        .code{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}
        .btnSmall{border:none;border-radius:10px;padding:8px 12px;font-weight:700;cursor:pointer;background:#000;color:#fff}
      `}</style>

      <div className="wrap">
        <header>
          <div className="hdr">Pay with Cash App</div>
          <div className="muted">
            Order <b>{order || '—'}</b> • Total <b>${total || '—'}</b>
          </div>
        </header>

        <section className="card">
          <div className="row">
            <div className="pill">Cashtag: <span className="code">{CASH_TAG}</span></div>
            <button className="btnSmall" onClick={copyOrder}>
              Copy “Order {order}”
            </button>
          </div>

          <a href={links.deep} className="btn btnApp">Open in Cash App</a>
          <a href={links.web} className="btn btnWeb">Pay on cash.app</a>

          <p className="muted" style={{ marginTop: 12 }}>
            In the memo/note, paste <b>“Order {order}”</b> so we can match your payment.
            {copied ? <span style={{ marginLeft: 8 }}>{copied}</span> : null}
          </p>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CashAppInner />
    </Suspense>
  );
}
