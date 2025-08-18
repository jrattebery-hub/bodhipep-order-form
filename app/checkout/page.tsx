'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';

/** ---------- DATA ---------- */

type Group = 'GLP-1' | 'Wellness' | 'Supplies';
type Item = { sku: string; label: string; price: number; group: Group };

const PRODUCTS: Item[] = [
  // GLP-1
  { sku: 'RT10', label: 'Retatrutide 10mg', price: 70, group: 'GLP-1' },
  { sku: 'RT15', label: 'Retatrutide 15mg', price: 85, group: 'GLP-1' },
  { sku: 'RT20', label: 'Retatrutide 20mg', price: 100, group: 'GLP-1' },
  { sku: 'RT30', label: 'Retatrutide 30mg', price: 120, group: 'GLP-1' },
  { sku: 'CG05', label: 'Cagrilintide 5mg', price: 35, group: 'GLP-1' },
  { sku: 'CG10', label: 'Cagrilintide 10mg', price: 60, group: 'GLP-1' },

  // Wellness
  { sku: 'GL70',  label: 'Glow70 — 50mg GHK-Cu + 10mg BPC-157 + 10mg TB-500', price: 85, group: 'Wellness' },
  { sku: 'BB20',  label: 'BPC-157 (10mg) + TB-500 (10mg)', price: 70, group: 'Wellness' },
  { sku: 'BC10',  label: 'BPC-157 10mg', price: 25, group: 'Wellness' },
  { sku: 'TB10',  label: 'TB-500 10mg', price: 45, group: 'Wellness' },
  { sku: 'NAD5',  label: 'NAD+ — 500mg', price: 40, group: 'Wellness' },
  { sku: 'ET10',  label: 'Epithalon — 10mg', price: 25, group: 'Wellness' },
  { sku: 'MS10',  label: 'MOTS-c — 10mg', price: 30, group: 'Wellness' },
  { sku: 'CU50',  label: 'GHK-Cu — 50mg', price: 20, group: 'Wellness' },
  { sku: 'AU100', label: 'AHK-Cu 100mg', price: 40, group: 'Wellness' },
  { sku: 'TSM10', label: 'Tesamorelin 10mg', price: 50, group: 'Wellness' },
  { sku: 'IP10',  label: 'Ipamorelin 10mg', price: 30, group: 'Wellness' },
  { sku: 'SK10',  label: 'Selank 10mg', price: 23, group: 'Wellness' },
  { sku: 'SX10',  label: 'Semax 10mg', price: 23, group: 'Wellness' },
  { sku: 'P141',  label: 'PT-141 10mg', price: 25, group: 'Wellness' },

  // Supplies
  { sku: 'BW30', label: 'Bacteriostatic Water — 30ml', price: 15, group: 'Supplies' },
  { sku: 'BW10', label: 'Bacteriostatic Water — 10ml', price: 8,  group: 'Supplies' },
  { sku: 'BW03', label: 'Bacteriostatic Water — 3ml',  price: 4,  group: 'Supplies' },
  { sku: 'SY10', label: '31g 5/16″ 1ml — Syringes (10-pack)',  price: 5, group: 'Supplies' },
  { sku: 'SY05', label: '31g 5/8″ .5ml — Syringes (10-pack)',  price: 5, group: 'Supplies' },
  { sku: 'SY03', label: '31g 5/8″ .3ml — Syringes (10-pack)',  price: 5, group: 'Supplies' },
  { sku: 'SY23', label: '23g .3ml — Syringe for reconstitution', price: 1, group: 'Supplies' },
  { sku: 'AW19', label: 'Alcohol Wipes (100-pack)', price: 5, group: 'Supplies' },
];

// simple bundle presets (AOV booster)
const BUNDLES = [
  {
    key: 'bundle-metabolic',
    label: 'Starter Metabolic Duo',
    desc: 'Retatrutide 10mg + Cagrilintide 5mg',
    skus: [{ sku: 'RT10', qty: 1 }, { sku: 'CG05', qty: 1 }],
    saveText: 'Save $10',
  },
  {
    key: 'bundle-glow',
    label: 'Skin Glow Stack',
    desc: 'GHK-Cu 50mg + BPC-157 10mg',
    skus: [{ sku: 'CU50', qty: 1 }, { sku: 'BC10', qty: 1 }],
    saveText: 'Save $5',
  },
];

const BRAND = { bg: '#EAD7BF', green: '#5A7A65', ink: '#2a2a2a', muted: '#5f6a63' };

type Form = {
  name: string;
  email: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
};

/** ---------- PAGE ---------- */

export default function CheckoutPage() {
  const [form, setForm] = useState<Form>({
    name: '', email: '',
    address1: '', city: '', state: '', zip: '',
  });
  const [qty, setQty] = useState<Record<string, number>>({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(
    () => PRODUCTS.map(p => ({ ...p, qty: Number(qty[p.sku] || 0) })).filter(i => i.qty > 0),
    [qty]
  );

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingFee = items.length ? 10 : 0;
  const total = subtotal + shippingFee;

  function step(sku: string, delta: number) {
    setQty(q => ({ ...q, [sku]: Math.max(0, (q[sku] || 0) + delta) }));
  }

  function addBundle(bundleSkus: { sku: string; qty: number }[]) {
    setQty(prev => {
      const next = { ...prev };
      for (const { sku, qty } of bundleSkus) {
        next[sku] = Math.max(0, (next[sku] || 0) + qty);
      }
      return next;
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function prettyError(raw: unknown) {
    const msg = (raw as any)?.message || String(raw) || 'Order failed';
    if (msg.includes('Unexpected token') || msg.startsWith('HTTP ')) {
      return 'We hit a snag. Please try again or choose another payment option.';
    }
    return msg;
  }

  async function submitWith(payment: 'Square' | 'Venmo' | 'CashApp' | 'Crypto') {
    if (placing) return;
    setError(null);

    if (!items.length) { setError('Please add at least one item to your order.'); return; }
    const { name, email, address1, city, state, zip } = form;
    if (!name || !email || !address1 || !city || !state || !zip) {
      setError('We just need your shipping details so we know where to send it.'); return;
    }

    const payload = {
      ...form,
      payment,
      items: items.map(i => ({ sku: i.sku, qty: i.qty })),
    };

    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      window.location.href = `/pay/${payment.toLowerCase()}?order=${json.order_id}&total=${json.total}`;
    } catch (e: any) {
      setError(prettyError(e));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPlacing(false);
    }
  }

  const estDelivery = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 3);
    return `${d.toLocaleString('en-US', { month: 'short', day: 'numeric' })}–${d2.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  return (
    <div
      style={{
        minHeight: '100dvh',
        color: BRAND.ink,
        backgroundImage: 'url(/img/lotus-bg.png)',
        backgroundColor: BRAND.bg,
        backgroundSize: '720px auto',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="container">

        {/* brand lockup */}
        <div className="brand">
          <img src="/img/logo-bodhipep.png" alt="BodhiPep" className="brand-logo" />
          <div>
            <div className="brand-text">BodhiPep</div>
            <div className="tagline">Sacred Molecules. Shipped Fresh.</div>
          </div>
        </div>

        <h1 className="h-page">Complete Your Order</h1>
        <p className="subtitle">
          Boutique, research-grade peptides. Flat $10 shipping. Secure checkout.
        </p>

        {/* trust bar */}
        <div className="trustbar">
          <span>✚ Licensed pharmacy partner</span>
          <span>🔒 Secure payment</span>
          <span>🚚 Ships in 2–3 business days</span>
        </div>

        <div className="lotus-rule" />

        {error && <div className="alert error">{error}</div>}

        {/* --- Shipping Info --- */}
        <div className="card pad">
          <h2 className="h-sub">Where should we send it?</h2>

          <label className="label">Full name</label>
          <input
            className="input"
            placeholder="Jane Doe (for shipping label)"
            autoComplete="name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@domain.com"
            autoComplete="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />

          <label className="label">Address</label>
          <input
            className="input"
            placeholder="Street address"
            autoComplete="address-line1"
            value={form.address1}
            onChange={e => setForm({ ...form, address1: e.target.value })}
          />

          <div className="row cols-3">
            <div>
              <label className="label">City</label>
              <input
                className="input"
                placeholder="City"
                autoComplete="address-level2"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State</label>
              <select
                className="input"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                autoComplete="address-level1"
              >
                <option value="">Select</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ZIP</label>
              <input
                className="input"
                placeholder="12345"
                inputMode="numeric"
                autoComplete="postal-code"
                value={form.zip}
                onChange={e => setForm({ ...form, zip: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* --- Products --- */}
        <div className="card pad">
          <h2 className="h-sub">Choose your items</h2>

          <div className="helper">
            <b>GLP-1</b>: Clinician-guided metabolic support.
          </div>
          <Section title="GLP-1">
            {PRODUCTS.filter(p => p.group==='GLP-1').map(p => (
              <ProductRow key={p.sku} item={p} qty={qty[p.sku]||0} step={d=>step(p.sku,d)} />
            ))}
          </Section>

          <div className="helper">
            <b>Wellness</b>: Recovery, skin & vitality essentials.
          </div>
          <Section title="Wellness">
            {PRODUCTS.filter(p => p.group==='Wellness').map(p => (
              <ProductRow key={p.sku} item={p} qty={qty[p.sku]||0} step={d=>step(p.sku,d)} />
            ))}
          </Section>

          <Section title="Supplies">
            {PRODUCTS.filter(p => p.group==='Supplies').map(p => (
              <ProductRow key={p.sku} item={p} qty={qty[p.sku]||0} step={d=>step(p.sku,d)} />
            ))}
          </Section>

          {/* Bundles */}
          <div className="bundles">
            <h3 className="h-mini">Popular bundles</h3>
            {BUNDLES.map(b => (
              <button key={b.key} className="bundle" onClick={()=>addBundle(b.skus)}>
                <div>
                  <div className="bundle-title">{b.label}</div>
                  <div className="bundle-desc">{b.desc}</div>
                </div>
                <div className="bundle-save">{b.saveText}</div>
              </button>
            ))}
          </div>
        </div>

        {/* --- Summary (sticky) --- */}
        <div className="card pad summary sticky">
          <h2 className="h-sub">Your Order</h2>
          {items.length === 0 && (
            <div className="muted">Pick your items above—your total updates automatically.</div>
          )}

          {items.map(i => (
            <div key={i.sku} className="rowline">
              <span>{i.qty}× {i.label}</span>
              <b className="price">${i.price * i.qty}</b>
            </div>
          ))}
          <div className="rowline"><span>Shipping</span><b className="price">${shippingFee}</b></div>
          <div className="divider" />
          <div className="rowline total">
            <span>Total</span><b className="price">${total}</b>
          </div>
          <div className="est">Est. delivery: {estDelivery}</div>
        </div>

        {/* Help / contact */}
        <div className="card pad help">
          Need help? Text us at <a href="sms:+15128814808">(512) 881-4808</a> • <a href="mailto:info@bodhipep.com">info@bodhipep.com</a>
        </div>

        {/* --- Pay Buttons --- */}
        <div style={{ display:'grid', gap:12, marginBottom: 8 }}>
          <button disabled={placing} onClick={()=>submitWith('Square')} className="btn btn-square">
            PAY WITH SQUARE
            <div className="btn-sub">All major cards, secure</div>
          </button>
          <button disabled={placing} onClick={()=>submitWith('Venmo')} className="btn btn-venmo">
            PAY WITH VENMO
            <div className="btn-sub">Fast peer-to-peer checkout</div>
          </button>
          <button disabled={placing} onClick={()=>submitWith('CashApp')} className="btn btn-cashapp">
            PAY WITH CASH APP
            <div className="btn-sub">Card or balance</div>
          </button>
          <button disabled={placing} onClick={()=>submitWith('Crypto')} className="btn btn-crypto">
            PAY WITH CRYPTO
            <div className="btn-sub">BTC/ETH/USDC supported</div>
          </button>
        </div>

        <div className="pay-note">Payments processed securely via Square, Venmo & Cash App.</div>

        {/* Disclaimer / footer */}
        <div className="disclaimer">
          For research use. Not intended to diagnose, treat, cure, or prevent disease. By placing an order you agree to our Terms & Privacy.
        </div>
      </div>

      {/* ====== GLOBAL STYLES ====== */}
      <style jsx global>{`
        :root{
          --bg:#EAD7BF;
          --card:#FAF8F6;
          --tan:#D6B89C;
          --green:#5A7A65;
          --ink:#2A2A2A;
          --muted:#5F6A63;
          --line:rgba(0,0,0,.14);
          --focus:rgba(90,122,101,.35);
          --error-bg:#FBE9E7; --error-ink:#8A2E2C;
        }
        *{box-sizing:border-box}
        body{color:var(--ink);background:var(--bg)}
        .container{max-width:760px;margin:0 auto;padding:36px 20px}

        /* brand + headings */
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:6px}
        .brand-logo{width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.12))}
        .brand-text{font-family:"Playfair Display", Georgia, serif;font-weight:700;font-size:22px;color:var(--green);letter-spacing:.02em}
        .tagline{font-size:13px;color:var(--muted);margin-top:2px}
        .h-page{font-family:"Playfair Display", Georgia, serif;font-weight:700;font-size:28px;line-height:36px;margin:6px 0 2px}
        .subtitle{color:var(--muted);margin:0 0 8px}
        .trustbar{display:flex;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:13px;margin:4px 0 10px}
        .h-sub{font-family:"Playfair Display", Georgia, serif;font-weight:600;font-size:20px;line-height:28px;margin:8px 0 12px;border-bottom:1px solid var(--line);padding-bottom:4px}
        .lotus-rule{height:1px;background:linear-gradient(90deg,transparent, var(--green), transparent);opacity:.35;margin:6px 0 18px}

        /* cards & inputs */
        .card{background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.06);margin-bottom:24px}
        .pad{padding:24px}
        .label{display:block;font-size:12px;letter-spacing:.02em;text-transform:uppercase;color:var(--muted);margin:12px 0 6px}
        .input{width:100%;background:#fff;border:1px solid var(--green);border-radius:10px;padding:12px 12px 11px;outline:none}
        .input:focus{box-shadow:0 0 0 3px var(--focus)}
        .row{display:grid;gap:16px}
        .cols-3{grid-template-columns:2fr 1fr 1fr}
        @media (max-width:719px){ .cols-3{grid-template-columns:1fr} }
        .muted{color:var(--muted)}

        /* product rows */
        .helper{color:var(--muted);font-size:13px;margin:2px 0 8px}
        .item{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
        .item:last-child{border-bottom:none}
        .name{font-weight:600}
        .price{font-variant-numeric:tabular-nums}
        .qty{display:flex;align-items:center;gap:8px}
        .btn-round{width:36px;height:36px;border-radius:999px;border:1px solid var(--green);background:#fff;cursor:pointer}
        .btn-round:active{transform:translateY(1px)}

        /* bundles */
        .bundles{margin-top:8px}
        .h-mini{font-weight:700;margin:8px 0}
        .bundle{display:flex;justify-content:space-between;align-items:center;width:100%;padding:12px 14px;border-radius:10px;border:1px dashed var(--green);background:#fff;cursor:pointer;margin-top:8px}
        .bundle:hover{background:#f8f8f8}
        .bundle-title{font-weight:700}
        .bundle-desc{color:var(--muted);font-size:13px}
        .bundle-save{font-weight:700;color:var(--green)}

        /* summary */
        .summary{background:#F3EFE8}
        .sticky{position:sticky;top:10px}
        .rowline{display:flex;justify-content:space-between;margin:8px 0}
        .divider{height:1px;background:var(--line);margin:10px 0}
        .total{font-size:20px;font-weight:700}
        .est{color:var(--muted);font-size:13px;margin-top:4px}

        /* misc */
        .alert{border-radius:12px;padding:12px 14px;margin:12px 0;border:1px solid rgba(138,46,44,.25);background:var(--error-bg);color:var(--error-ink)}
        .help{color:var(--muted);text-align:center}
        .help a{color:var(--green);text-decoration:none}

        /* buttons */
        .btn{display:block;width:100%;text-align:center;padding:16px 20px;border-radius:12px;border:1px solid transparent;font-weight:700;letter-spacing:.04em;color:#fff;transition:filter .15s, box-shadow .15s}
        .btn-sub{font-weight:500;opacity:.85;font-size:12px;line-height:16px}
        .btn + .btn{margin-top:10px}
        .btn-square{background:#4F6357}
        .btn-venmo{background:#4E8EA8}
        .btn-cashapp{background:#34A853}
        .btn-crypto{background:#E69521}
        .btn:hover{filter:brightness(.97);box-shadow:0 3px 6px rgba(0,0,0,.10)}
        .btn:disabled{opacity:.6}
        .pay-note{color:var(--muted);text-align:center;font-size:12px;margin:8px 0 16px}
        .disclaimer{color:var(--muted);text-align:center;font-size:12px;margin:16px 0 40px}
      `}</style>

      {/* Webfonts */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}

/** ---------- UI bits ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h3 className="h-sub" style={{ marginTop: 8 }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function ProductRow({ item, qty, step }: { item: Item; qty: number; step: (d: number) => void }) {
  return (
    <div className="item">
      <div>
        <div className="name">{item.label}</div>
        <div className="muted">${item.price}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div className="price">${item.price}</div>
        <div className="qty">
          <button onClick={()=>step(-1)} disabled={qty<=0} className="btn-round" aria-label="Decrease">−</button>
          <div aria-live="polite" style={{ minWidth: 20, textAlign:'center' }}>{qty}</div>
          <button onClick={()=>step(1)} className="btn-round" aria-label="Increase">+</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

