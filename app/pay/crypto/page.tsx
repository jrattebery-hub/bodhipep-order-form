'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const BRAND = { bg: '#EAD7BF', green: '#5A7A65', ink: '#2a2a2a', muted: '#5f6a63' };

// Inserted live wallets
const WALLETS = {
  BTC: 'bc1qy3f98faj8fpujn3j05s0ddls53dczn8kc679zc',
  ETH: '0x2C864d096742C405eF227508BCF58D7E8C54B427',
  XMR: '888x19YwYY3brWd91XqT2rF6KTigFiwMMU4QHZidy4AzcV4m8EfCJNFYctpaM1oZmCJdNjyAjf3xRPKz8h2wHKLoCzcEU76',
};

function copy(text: string, setMsg: (s: string) => void) {
  navigator.clipboard.writeText(text).then(
    () => setMsg('Copied'),
    () => setMsg('Could not copy')
  );
}

function CryptoPayInner() {
  const q = useSearchParams();
  const order = q.get('order') ?? '';
  const totalUSD = q.get('total') ?? '';

  const [msgBTC, setMsgBTC] = useState('');
  const [msgETH, setMsgETH] = useState('');
  const [msgXMR, setMsgXMR] = useState('');

  useEffect(() => {
    if (msgBTC) setTimeout(() => setMsgBTC(''), 1200);
    if (msgETH) setTimeout(() => setMsgETH(''), 1200);
    if (msgXMR) setTimeout(() => setMsgXMR(''), 1200);
  }, [msgBTC, msgETH, msgXMR]);

  const uris = useMemo(() => {
    const note = encodeURIComponent(`Order ${order}`);
    return {
      btc: `bitcoin:${WALLETS.BTC}?label=${note}`,
      eth: `ethereum:${WALLETS.ETH}`,
      xmr: `monero:${WALLETS.XMR}?tx_description=${note}`,
    };
  }, [order]);

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
        .wrap{max-width:820px;margin:0 auto}
        .card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:18px}
        .row{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .grid{display:grid;gap:14px}
        .hdr{font-size:22px;font-weight:800;color:${BRAND.green}}
        .addr{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:13px; word-break:break-all}
        .btn{border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
        .btnCopy{background:#000;color:#fff}
        .btnOpen{background:${BRAND.green};color:#fff}
        .muted{color:${BRAND.muted}}
        .pill{font-size:12px;border:1px solid rgba(0,0,0,.12);padding:6px 10px;border-radius:999px;background:#faf7f1}
      `}</style>

      <div className="wrap grid">
        <header className="row" style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/img/logo.png" width={40} height={40} alt="BodhiPep" style={{ borderRadius: 10 }} />
            <div>
              <div className="hdr" style={{ margin: 0 }}>Crypto Payment</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Order <b>{order || '—'}</b> <span className="pill">Total USD: ${totalUSD || '—'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="card grid">
          <div className="muted" style={{ fontSize: 13 }}>
            Send the USD equivalent of your total to one of the wallets below. Put <b>“Order {order}”</b> in the transaction
            note/description if your wallet supports it. If auto-matching fails, reply to the order email with your tx hash.
          </div>

          {/* BTC */}
          <div className="grid" style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 12 }}>
            <div className="row">
              <h3 style={{ margin: 0 }}>BTC (Bitcoin)</h3>
              <a className="btn btnOpen" href={uris.btc}>Open in wallet</a>
            </div>
            <div className="addr">{WALLETS.BTC}</div>
            <div className="row">
              <button className="btn btnCopy" onClick={() => copy(WALLETS.BTC, setMsgBTC)}>Copy address</button>
              <div className="muted">{msgBTC}</div>
            </div>
          </div>

          {/* ETH */}
          <div className="grid" style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 12 }}>
            <div className="row">
              <h3 style={{ margin: 0 }}>ETH (Ethereum)</h3>
              <a className="btn btnOpen" href={uris.eth}>Open in wallet</a>
            </div>
            <div className="addr">{WALLETS.ETH}</div>
            <div className="row">
              <button className="btn btnCopy" onClick={() => copy(WALLETS.ETH, setMsgETH)}>Copy address</button>
              <div className="muted">{msgETH}</div>
            </div>
          </div>

          {/* XMR */}
          <div className="grid" style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 12 }}>
            <div className="row">
              <h3 style={{ margin: 0 }}>XMR (Monero)</h3>
              <a className="btn btnOpen" href={uris.xmr}>Open in wallet</a>
            </div>
            <div className="addr">{WALLETS.XMR}</div>
            <div className="row">
              <button className="btn btnCopy" onClick={() => copy(WALLETS.XMR, setMsgXMR)}>Copy address</button>
              <div className="muted">{msgXMR}</div>
            </div>
          </div>
        </section>

        <footer className="muted" style={{ fontSize: 12 }}>
          Tip: most wallets support deep links like <code>bitcoin:&lt;address&gt;</code>. For Monero, some wallets honor
          <code>?tx_description=</code> to carry “Order {order}”.
        </footer>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CryptoPayInner />
    </Suspense>
  );
}
