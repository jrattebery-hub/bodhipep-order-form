// app/api/orders/route.ts
export const runtime = 'nodejs';

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { Client, Environment } from 'square';

import {
  getProductsBySKUs,
  patchProductsReserved,
  createOrder,
  createOrderItems,
  findOrCreateClientByEmail,
} from '@/lib/airtable';

const FREE_SHIP_THRESHOLD = 200;
const FLAT_SHIP = 10;

const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bodhipep.com';

const square = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

function dollars(n: number) { return Math.round(n * 100) / 100; }
function cents(n: number) { return Math.round(n * 100); }
function newId() { return 'BD' + Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, address1, city, state, zip, items, payment } = body || {};

    if (!name || !email || !address1 || !city || !state || !zip) {
      return Response.json({ ok:false, error:'Missing shipping fields' }, { status: 400 });
    }
    if (!Array.isArray(items) || !items.length) {
      return Response.json({ ok:false, error:'Empty cart' }, { status: 400 });
    }

    // Aggregate qty by SKU
    const qtyBySKU: Record<string, number> = {};
    for (const it of items) {
      const q = Number(it.qty || 0);
      if (q > 0) qtyBySKU[String(it.sku)] = (qtyBySKU[String(it.sku)] || 0) + q;
    }
    const skus = Object.keys(qtyBySKU);
    if (!skus.length) return Response.json({ ok:false, error:'Invalid cart' }, { status: 400 });

    // Fetch authoritative products
    const prods = await getProductsBySKUs(skus);
    const bySKU = new Map(prods.map(p => [String(p.fields['SKU']), p]));

    // Validate + compute subtotal + prepare reserve patch
    let subtotal = 0;
    const reserveUpdates: Array<{ id: string; newReserved: number }> = [];

    for (const [sku, qty] of Object.entries(qtyBySKU)) {
      const rec = bySKU.get(sku);
      if (!rec) return Response.json({ ok:false, error:`Unknown SKU ${sku}` }, { status: 400 });

      const price = Number(rec.fields['Price'] || 0);
      const onHand = Number(rec.fields['OnHand'] || 0);
      const reserved = Number(rec.fields['Reserved'] || 0);
      const remaining = 'Remaining' in rec.fields
        ? Number(rec.fields['Remaining'] || 0)
        : Math.max(onHand - reserved, 0);

      if (qty > remaining) {
        return Response.json({ ok:false, error:`${sku} only has ${remaining} left` }, { status: 409 });
      }

      subtotal += price * qty;
      reserveUpdates.push({ id: rec.id, newReserved: reserved + qty });
    }

    if (subtotal <= 0) return Response.json({ ok:false, error:'Invalid cart' }, { status: 400 });

    // Shipping rule: free over $200
    const shipping = subtotal > FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIP;
    const total = dollars(subtotal + shipping);
    const order_id = newId();

    // Reserve stock (increment Reserved)
    if (reserveUpdates.length) {
      await patchProductsReserved(reserveUpdates);
    }

    // Optional: link to client (creates if not exists)
    let clientLink: string[] | undefined = undefined;
    try {
      const client = await findOrCreateClientByEmail(name, email);
      if (client?.id) clientLink = [client.id];
    } catch {}

    // Create Airtable Order
    const shipTo = `${name}\n${address1}\n${city}, ${state} ${zip}`;
    const orderRec = await createOrder({
      OrderID: order_id,
      Status: 'PENDING',
      Payment: payment || '',
      Subtotal: dollars(subtotal),
      Shipping: dollars(shipping),
      Total: total,
      Email: email,
      'Ship To': shipTo,
      ...(clientLink ? { Client: clientLink } : {}),
    });

    // Create Airtable Order Items
    const itemRecords = Object.entries(qtyBySKU).map(([sku, qty]) => {
      const p = bySKU.get(sku)!;
      const unit = Number(p.fields['Price'] || 0);
      return { fields: {
        Order: [orderRec.id],
        Product: [p.id],
        Qty: qty,
        UnitPrice: unit,
      }};
    });
    if (itemRecords.length) await createOrderItems(itemRecords);

    // If Square, build a hosted checkout link and return it as `redirect`
    if (String(payment).toLowerCase() === 'square') {
      const lineItems = Object.entries(qtyBySKU).map(([sku, qty]) => {
        const p = bySKU.get(sku)!;
        const unit = Number(p.fields['Price'] || 0);
        return {
          name: sku, // or use p.fields['Name'] if you have one
          quantity: String(qty),
          basePriceMoney: { amount: BigInt(cents(unit)), currency: 'USD' as const },
          note: sku,
        };
      });

      const serviceCharges = shipping > 0 ? [{
        name: 'Shipping',
        amountMoney: { amount: BigInt(cents(shipping)), currency: 'USD' as const },
        calculationPhase: 'TOTAL_PHASE' as const,
        taxable: false,
      }] : [];

      const orderResp = await square.ordersApi.createOrder({
        order: {
          locationId: SQUARE_LOCATION_ID,
          referenceId: order_id,
          lineItems,
          serviceCharges,
          metadata: { airtable_id: orderRec.id, order_no: order_id },
        },
        idempotencyKey: crypto.randomUUID(),
      });

      const sqOrderId = orderResp.result.order?.id;
      if (!sqOrderId) throw new Error('Square order not created');

      const linkResp = await square.paymentLinksApi.createPaymentLink({
        idempotencyKey: crypto.randomUUID(),
        orderId: sqOrderId,
        checkoutOptions: {
          askForShippingAddress: true,
          allowTipping: false,
          redirectUrl: `${BASE_URL}/thank-you?o=${encodeURIComponent(order_id)}`,
          merchantSupportEmail: 'orders@bodhipep.com',
        },
        // We could prefill email/address here if desired
      });

      const redirect = linkResp.result.paymentLink?.url;
      if (!redirect) throw new Error('Square payment link not created');

      return Response.json({ ok:true, order_id, total, redirect });
    }

    // For Venmo/CashApp/Crypto: send to internal pay pages
    const method = String(payment || '').toLowerCase();
    const redirect = `/pay/${method}?order=${order_id}&total=${total}`;

    return Response.json({ ok:true, order_id, total, redirect });
  } catch (e: any) {
    console.error('ORDERS ERROR', e?.message || e);
    return Response.json({ ok:false, error:'server_error' }, { status: 500 });
  }
}
