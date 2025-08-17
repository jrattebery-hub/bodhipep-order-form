import { NextResponse } from "next/server";

const BASE = "https://connect.squareup.com"; // production
const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Short server-side reference code (not sent by client)
function newOrderCode() {
  return `BP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
    }
    if (!ACCESS_TOKEN || !LOCATION_ID) {
      return NextResponse.json({ ok: false, reason: "square_not_configured" }, { status: 200 });
    }

    const orderCode = newOrderCode();
    const body = {
      idempotency_key: crypto.randomUUID(),
      quick_pay: {
        name: `BodhiPep Payment ${orderCode}`,      // generic label only
        price_money: { amount: Math.round(amount * 100), currency: "USD" },
        location_id: LOCATION_ID,
      },
      // redirect_url: "https://yourdomain.com/order/thanks?ref=" + orderCode,
    };

    const resp = await fetch(`${BASE}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Square create link error:", resp.status, data?.errors || data);
      return NextResponse.json({ ok: false, error: "square_request_failed" }, { status: 500 });
    }

    const url = data?.payment_link?.url as string | undefined;
    if (!url) {
      console.error("Square: missing checkout URL", data);
      return NextResponse.json({ ok: false, error: "missing_checkout_url" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url }, { status: 200 });
  } catch (err: any) {
    console.error("Square route exception:", err?.message || err);
    return NextResponse.json({ ok: false, error: "server_exception" }, { status: 500 });
  }
}


