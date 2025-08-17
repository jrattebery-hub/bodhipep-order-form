"use client";

import { useMemo, useState } from "react";

/** ---------- DATA ---------- */

type Group = "GLP-1" | "Wellness" | "Supplies";
type Item = { sku: string; label: string; price: number; group: Group };

const PRODUCTS: Item[] = [
  // GLP-1
  { sku: "RT10", label: "Retatrutide 10mg", price: 70, group: "GLP-1" },
  { sku: "RT15", label: "Retatrutide 15mg", price: 85, group: "GLP-1" },
  { sku: "RT20", label: "Retatrutide 20mg", price: 100, group: "GLP-1" },
  { sku: "RT30", label: "Retatrutide 30mg", price: 120, group: "GLP-1" },
  { sku: "CG05", label: "Cagrilintide 5mg", price: 35, group: "GLP-1" },
  { sku: "CG10", label: "Cagrilintide 10mg", price: 60, group: "GLP-1" },

  // Wellness
  { sku: "GL70",  label: "Glow70 — 50mg GHK-Cu + 10mg BPC-157 + 10mg TB-500", price: 85, group: "Wellness" },
  { sku: "BB20",  label: "BPC-157 (10mg) + TB-500 (10mg)", price: 70, group: "Wellness" },
  { sku: "BC10",  label: "BPC-157 10mg", price: 25, group: "Wellness" },
  { sku: "TB10",  label: "TB-500 10mg", price: 45, group: "Wellness" },
  { sku: "NAD5",  label: "NAD+ — 500mg", price: 40, group: "Wellness" },
  { sku: "ET10",  label: "Epithalon — 10mg", price: 25, group: "Wellness" },
  { sku: "MS10",  label: "MOTS-c — 10mg", price: 30, group: "Wellness" },
  { sku: "CU50",  label: "GHK-Cu — 50mg", price: 20, group: "Wellness" },
  { sku: "AU100", label: "AHK-Cu 100mg", price: 40, group: "Wellness" },
  { sku: "TSM10", label: "Tesamorelin 10mg", price: 50, group: "Wellness" },
  { sku: "IP10",  label: "Ipamorelin 10mg", price: 30, group: "Wellness" },
  { sku: "SK10",  label: "Selank 10mg", price: 23, group: "Wellness" },
  { sku: "SX10",  label: "Semax 10mg", price: 23, group: "Wellness" },
  { sku: "P141",  label: "PT-141 10mg", price: 25, group: "Wellness" },

  // Supplies
  { sku: "BW30", label: "Bacteriostatic Water — 30ml", price: 15, group: "Supplies" },
  { sku: "BW10", label: "Bacteriostatic Water — 10ml", price: 8,  group: "Supplies" },
  { sku: "BW03", label: "Bacteriostatic Water — 3ml",  price: 4,  group: "Supplies" },
  { sku: "SY10", label: "31g 5/16″ 1ml — Syringes (10-pack)",  price: 5, group: "Supplies" },
  { sku: "SY05", label: "31g 5/8″ .5ml — Syringes (10-pack)",  price: 5, group: "Supplies" },
  { sku: "SY03", label: "31g 5/8″ .3ml — Syringes (10-pack)",  price: 5, group: "Supplies" },
  { sku: "SY23", label: "23g .3ml — Syringe for reconstitution", price: 1, group: "Supplies" },
  { sku: "AW19", label: "Alcohol Wipes (100-pack)", price: 5, group: "Supplies" },
];

const BRAND = { bg: "#EAD7BF", green: "#5A7A65", ink: "#2a2a2a", muted: "#5f6a63" };

/** ---------- PAGE ---------- */

export default function CheckoutPage() {
  const [form, setForm] = useState({
    name: "", email: "",
    address1: "", city: "", state: "", zip: "",
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

  async function submitWith(payment: "Square" | "Venmo" | "CashApp" | "Crypto") {
    if (placing) return;
    setError(null);

    if (!items.length) { setError("Add at least one item."); return; }
    const { name, email, address1, city, state, zip } = form;
    if (!name || !email || !address1 || !city || !state || !zip) {
      setError("Please complete shipping info."); return;
    }

    const payload = {
      ...form,
      payment,
      items: items.map(i => ({ sku: i.sku, qty: i.qty })),
    };

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      // ✅ Redirect into dedicated pay pages
      if (payment === "Square") {
        window.location.href = `/pay/square?order=${json.order_id}&total=${json.total}`;
      } else if (payment === "Venmo") {
        window.location.href = `/pay/venmo?order=${json.order_id}&total=${json.total}`;
      } else if (payment === "CashApp") {
        window.location.href = `/pay/cashapp?order=${json.order_id}&total=${json.total}`;
      } else if (payment === "Crypto") {
        window.location.href = `/pay/crypto?order=${json.order_id}&total=${json.total}`;
      }
    } catch (e: any) {
      setError(e?.message || "Order failed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        color: BRAND.ink,
        backgroundImage: "url(/img/lotus-bg.png)",
        backgroundColor: BRAND.bg,
        backgroundSize: "1200px auto",
        backgroundRepeat: "repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>BodhiPep Checkout</h1>

        {error && (
          <p style={{ background: "#ffe0e0", color: "#900", padding: 12, marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* --- Shipping Info --- */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Shipping Info</h2>
          {["name","email","address1","city","state","zip"].map(f => (
            <input
              key={f}
              placeholder={f[0].toUpperCase()+f.slice(1)}
              value={(form as any)[f]}
              onChange={e => setForm({ ...form, [f]: e.target.value })}
              style={{ display:"block", marginBottom:8, padding:8, width:"100%" }}
            />
          ))}
        </div>

        {/* --- Products --- */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Products</h2>
          {(["GLP-1","Wellness","Supplies"] as Group[]).map(group => (
            <Section key={group} title={group}>
              {PRODUCTS.filter(p => p.group===group).map(p => (
                <ProductRow key={p.sku} item={p} qty={qty[p.sku]||0} step={d=>step(p.sku,d)} />
              ))}
            </Section>
          ))}
        </div>

        {/* --- Summary --- */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Summary</h2>
          {items.map(i => (
            <div key={i.sku} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span>{i.qty}× {i.label}</span>
              <b>${i.price * i.qty}</b>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span>Shipping</span>
            <b>${shippingFee}</b>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:18 }}>
            <span>Total</span>
            <b>${total}</b>
          </div>
        </div>

        {/* --- Pay Buttons --- */}
        <div style={{ display:"grid", gap:12 }}>
          <button disabled={placing} onClick={()=>submitWith("Square")} style={{ padding:12, background:BRAND.green, color:"white", border:0, borderRadius:8 }}>Pay with Square</button>
          <button disabled={placing} onClick={()=>submitWith("Venmo")} style={{ padding:12, background:"#3D95CE", color:"white", border:0, borderRadius:8 }}>Pay with Venmo</button>
          <button disabled={placing} onClick={()=>submitWith("CashApp")} style={{ padding:12, background:"#00D632", color:"white", border:0, borderRadius:8 }}>Pay with Cash App</button>
          <button disabled={placing} onClick={()=>submitWith("Crypto")} style={{ padding:12, background:"#FF9900", color:"white", border:0, borderRadius:8 }}>Pay with Crypto</button>
        </div>
      </div>
    </div>
  );
}

/** ---------- UI bits ---------- */

function Section({ title, children }: { title:string, children:any }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize:18, marginBottom:8 }}>{title}</h3>
      {children}
    </div>
  );
}

function ProductRow({ item, qty, step }: { item:Item, qty:number, step:(d:number)=>void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
      <span>{item.label} — ${item.price}</span>
      <div>
        <button onClick={()=>step(-1)} disabled={qty<=0} style={{ marginRight:6 }}>-</button>
        {qty}
        <button onClick={()=>step(1)} style={{ marginLeft:6 }}>+</button>
      </div>
    </div>
  );
}
