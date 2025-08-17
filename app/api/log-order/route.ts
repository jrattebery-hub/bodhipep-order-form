import { NextResponse } from "next/server";

const FORWARD_URL = process.env.MAKE_ORDERS_WEBHOOK_URL || "";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const stamped = { ...payload, received_at: new Date().toISOString(), source: "bodhipep-order-form" };

    if (FORWARD_URL) {
      const r = await fetch(FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stamped),
      });
      if (!r.ok) {
        return NextResponse.json({ ok: false, error: "forward_failed" }, { status: 502 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "server_exception" }, { status: 500 });
  }
}

