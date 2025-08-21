export const runtime = 'nodejs';

import {
  findOrderByOrderID,
  listOrderItemsForOrder,
  updateOrder,
  patchProductsAbsolute,
} from '@/lib/airtable';

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';
const BASE = (process.env.SQUARE_ENV || 'production').toLowerCase() === 'sandbox'
  ? 'https://connect.squareupsandbox.com'
  : 'https://connect.squareup.com';
const SQUARE_VER = '2024-06-20';

export async function POST(req: Request) {
  let payload: any;
  try {
    const raw = await req.text();
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok:false, error:'bad_json' }, { status: 400 });
  }

  try {
    const type = payload?.type || '';
    const paymentId = payload?.data?.object?.payment?.id;
    if (!type.startsWith('payment.') || !paymentId) {
      return Response.json({ ok:true }); // ignore others
    }

    // Fetch authoritative payment details
    const r = await fetch(`${BASE}/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Square-Version': SQUARE_VER },
      cache: 'no-store',
    });
    const j: any = await r.json();
    if (!r.ok) {
      console.error('SQUARE FETCH ERR', j);
      return Response.json({ ok:false }, { status: 500 });
    }

    const pay = j.payment;
    const status = String(pay?.status || '').toUpperCase();
    const orderId = String(pay?.reference_id || '').trim();
    const receiptUrl = pay?.receipt_url || '';

    if (!orderId) return Response.json({ ok:true, info:'no_order_ref' });

    const orderRec = await findOrderByOrderID(orderId);
    if (!orderRec) return Response.json({ ok:true, info:'order_not_found' });

    const items = await listOrderItemsForOrder(orderRec.id);

    if (status === 'COMPLETED' || status === 'APPROVED' || status === 'CAPTURED') {
      // Move reservation to real deduction: Reserved -= qty; OnHand -= qty
      // Read current product values first (we’ll patch absolute to be safe)
      const prodCounts: Record<string, { reserved?: number; onhand?: number }> = {};
      // We need each product’s current counts, so fetch them via expand-less calls:
      // Simpler: Airtable absolute patch requires current values; we’ll fetch per product by ID.
      // To reduce code here, we’ll compute new values by asking Airtable to set exact numbers.

      // Fetch all products once (by IDs present):
      const ids = Array.from(new Set(items.map(i => (i.fields['Product'] || [])[0])).values()).filter(Boolean);
      const prodsResp = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_PRODUCTS_TABLE || 'Products')}?filterByFormula=${encodeURIComponent('OR(' + ids.map(id => `RECORD_ID()='${id}'`).join(',') + ')')}`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN || ''}` },
      });
      const prodsJ: any = await prodsResp.json();
      const prodMap = new Map<string, any>((prodsJ.records || []).map((r: any) => [r.id, r]));

      // Compute new absolute values
      const absUpdates: Array<{ id: string; fields: any }> = [];
      for (const it of items) {
        const prodId = (it.fields['Product'] || [])[0];
        const qty = Number(it.fields['Qty'] || 0);
        if (!prodId || qty <= 0) continue;
        const current = prodMap.get(prodId);
        const curRes = Number(current?.fields?.Reserved || 0);
        const curOn  = Number(current?.fields?.OnHand || 0);
        absUpdates.push({
          id: prodId,
          fields: {
            Reserved: Math.max(curRes - qty, 0),
            OnHand: Math.max(curOn - qty, 0),
          },
        });
      }
      if (absUpdates.length) await patchProductsAbsolute(absUpdates);

      await updateOrder(orderRec.id, {
        Status: 'PAID',
        'Square Payment ID': paymentId,
        'Square Receipt URL': receiptUrl,
      });
    } else if (status === 'CANCELED' || status === 'FAILED') {
      // Release reservation: Reserved -= qty; OnHand unchanged
      const ids = Array.from(new Set(items.map(i => (i.fields['Product'] || [])[0])).values()).filter(Boolean);
      const prodsResp = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_PRODUCTS_TABLE || 'Products')}?filterByFormula=${encodeURIComponent('OR(' + ids.map(id => `RECORD_ID()='${id}'`).join(',') + ')')}`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN || ''}` },
      });
      const prodsJ: any = await prodsResp.json();
      const prodMap = new Map<string, any>((prodsJ.records || []).map((r: any) => [r.id, r]));

      const absUpdates: Array<{ id: string; fields: any }> = [];
      for (const it of items) {
        const prodId = (it.fields['Product'] || [])[0];
        const qty = Number(it.fields['Qty'] || 0);
        if (!prodId || qty <= 0) continue;
        const current = prodMap.get(prodId);
        const curRes = Number(current?.fields?.Reserved || 0);
        absUpdates.push({
          id: prodId,
          fields: { Reserved: Math.max(curRes - qty, 0) },
        });
      }
      if (absUpdates.length) await patchProductsAbsolute(absUpdates);

      await updateOrder(orderRec.id, { Status: 'CANCELED' });
    } else {
      // Pending/authorized — just mirror it
      await updateOrder(orderRec.id, { Status: (status || 'PENDING') });
    }

    return Response.json({ ok:true });
  } catch (e: any) {
    console.error('WEBHOOK ERR', e?.message || e);
    return Response.json({ ok:false }, { status: 500 });
  }
}
