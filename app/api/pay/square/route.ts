export const dynamic = 'force-dynamic';

/**
 * Create a Square Payment Link with amount + order prefilled.
 * Env required:
 *  - SQUARE_ACCESS_TOKEN
 *  - SQUARE_LOCATION_ID
 *
 * Call:
 *  /api/pay/square?order=ord_abc&total=12.34
 */
function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = url.searchParams.get('order') || '';
  const totalStr = url.searchParams.get('total') || '';
  const totalNum = Number(totalStr);

  if (!order || !Number.isFinite(totalNum) || totalNum <= 0) {
    return Response.json({ ok: false, error: 'bad_params' }, { status: 400 });
  }

  let SQUARE_ACCESS_TOKEN: string;
  let SQUARE_LOCATION_ID: string;

  try {
    SQUARE_ACCESS_TOKEN = envOrThrow('SQUARE_ACCESS_TOKEN');
    SQUARE_LOCATION_ID  = envOrThrow('SQUARE_LOCATION_ID');
  } catch (e: any) {
    console.error('ENV ERROR:', e?.message || e);
    return Response.json({ ok: false, error: 'missing_env' }, { status: 500 });
  }

  try {
    const amountCents = Math.round(totalNum * 100);
    const idempotencyKey = `bodhi_${order}`;

    const resp = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-06-20',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: `BodhiPep Order ${order}`,
          price_money: { amount: amountCents, currency: 'USD' },
          location_id: SQUARE_LOCATION_ID,
        },
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('SQUARE ERROR:', resp.status, data);
      return Response.json({ ok: false, error: data || `http_${resp.status}` }, { status: resp.status });
    }

    const urlOut = (data as any)?.payment_link?.url;
    if (!urlOut) {
      console.error('SQUARE NO URL:', data);
      return Response.json({ ok: false, error: 'no_url' }, { status: 500 });
    }

    return Response.json({ ok: true, url: urlOut });
  } catch (e: any) {
    console.error('SERVER ERROR:', e?.message || e);
    return Response.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 });
  }
}
