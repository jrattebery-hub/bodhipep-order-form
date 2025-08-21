// app/api/pay/square/route.ts

export const runtime = "nodejs";

/**
 * Create a Square Payment Link with amount + order prefilled.
 * Env required:
 *  - SQUARE_ACCESS_TOKEN
 *  - SQUARE_LOCATION_ID
 * Optional:
 *  - SQUARE_ENV = "production" | "sandbox"
 *
 * Supported:
 *  - GET  /api/pay/square?order=ord_abc&total=12.34
 *  - POST /api/pay/square  { orderNo, amount }
 */

function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

const BASE =
  (process.env.SQUARE_ENV || "production").toLowerCase() === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

const SQUARE_VER = "2024-06-20";

async function makeLink(origin: string, order: string, amount: number) {
  const SQUARE_ACCESS_TOKEN = envOrThrow("SQUARE_ACCESS_TOKEN");
  const SQUARE_LOCATION_ID = envOrThrow("SQUARE_LOCATION_ID");

  const amountCents = Math.round(amount * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Invalid amount");
  }

  // Add cents into idempotency key to avoid collisions if order retried with different amount
  const idempotencyKey = `bodhi_${order}_${amountCents}`;

  const resp = await fetch(`${BASE}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": SQUARE_VER,
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      quick_pay: {
        name: `BodhiPep Order ${order}`,
        price_money: { amount: amountCents, currency: "USD" },
        location_id: SQUARE_LOCATION_ID,
        reference_id: String(order),
        note: `BodhiPep Order ${order}`,
      },
      checkout_options: {
        redirect_url: `${origin}/pay/success?order=${encodeURIComponent(
          order
        )}`,
      },
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data?.errors?.[0]?.detail || "square_error";
    throw new Error(msg);
  }
  const urlOut = data?.payment_link?.url;
  if (!urlOut) throw new Error("no_url");
  return urlOut as string;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const order = u.searchParams.get("order") || "";
  const totalStr = u.searchParams.get("total") || "";
  const totalNum = Number(totalStr);

  if (!order || !Number.isFinite(totalNum) || totalNum <= 0) {
    return Response.json({ ok: false, error: "bad_params" }, { status: 400 });
  }

  try {
    const origin = `${u.protocol}//${u.host}`;
    const url = await makeLink(origin, order, totalNum);
    return Response.json({ ok: true, url });
  } catch (e: any) {
    console.error("SQUARE GET ERROR:", e?.message || e);
    return Response.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { orderNo, amount } = await req.json();
    if (!orderNo || !Number.isFinite(amount) || amount <= 0) {
      return Response.json({ ok: false, error: "bad_params" }, { status: 400 });
    }
    const origin = `${new URL(req.url).protocol}//${new URL(req.url).host}`;
    const url = await makeLink(origin, String(orderNo), Number(amount));
    return Response.json({ ok: true, url });
  } catch (e: any) {
    console.error("SQUARE POST ERROR:", e?.message || e);
    return Response.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}

