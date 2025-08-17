// ===================================================
// EXISTING FILE: EDIT ONLY INSIDE, DO NOT REWRITE
// CREATE NEW FILES *ONLY* IF THEY DO NOT EXIST
// Deliverables: Full copy/paste code only. No inserting into existing code
// ===================================================

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BRAND = { bg: "#EAD7BF", green: "#5A7A65", ink: "#2a2a2a", muted: "#5f6a63" };

export default function SquarePayPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Preparing secure checkout…");
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    const order = params.get("order");
    const total = params.get("total");
    if (!order || !total) {
      setErr("Missing order or total");
      setStatus("Could not start checkout");
      return;
    }

    (async () => {
      try {
        // Prefer POST (matches /app/checkout), then fall back to GET for backward compatibility.
        setStatus("Creating Square link…");
        let r = await fetch("/api/pay/square", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo: order, amount: Number(total) }),
        });

        let j: any = await r.json().catch(() => ({}));

        if (!r.ok || !j?.ok || !j.url) {
          // fallback to GET style
          r = await fetch(
            `/api/pay/square?order=${encodeURIComponent(order)}&total=${encodeURIComponent(total)}`
          );
          j = await r.json().catch(() => ({}));
          if (!r.ok || !j?.ok || !j.url) {
            setErr(typeof j?.error === "string" ? j.error : "Failed to create Square link");
            setStatus("Could not start checkout");
            return;
          }
        }

        setLink(j.url);
        setStatus("Opening Square…");
        window.location.href = j.url; // auto-redirect
      } catch (e: any) {
        setErr(e?.message || "Failed to create link");
        setStatus("Could not start checkout");
      }
    })();
  }, [params]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BRAND.bg,
        color: BRAND.ink,
        padding: "24px 14px",
      }}
    >
      <style>{`
        .wrap{max-width:560px;margin:0 auto}
        .card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.06);padding:20px}
        .hdr{font-size:22px;font-weight:800;color:${BRAND.green}}
        .muted{color:${BRAND.muted};font-size:13px}
        .btn{display:inline-block;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:12px;background:#000;color:#fff}
      `}</style>

      <div className="wrap">
        <header style={{ marginBottom: 12 }}>
          <div className="hdr">Square Checkout</div>
          <div className="muted">Redirecting you to our secure payment page…</div>
        </header>

        <section className="card">
          {!err ? (
            <>
              <p>{status}</p>
              <p className="muted">If nothing happens, this page will offer a manual link.</p>
            </>
          ) : (
            <>
              <p style={{ color: "#b00020" }}>Error: {err}</p>
              {link ? (
                <p>
                  <a className="btn" href={link} target="_blank" rel="noreferrer">
                    Open Square Manually
                  </a>
                </p>
              ) : null}
              <p className="muted">
                If this keeps happening, double-check your amount and try again.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
