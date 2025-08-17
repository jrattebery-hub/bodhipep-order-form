export const dynamic = 'force-dynamic';

import { promises as fs } from 'fs';
import path from 'path';

const dataDir    = path.join(process.cwd(), 'data');
const invPath    = path.join(dataDir, 'inventory.json');
const ordersPath = path.join(dataDir, 'orders.json');
const csvPath    = path.join(dataDir, 'orders.csv');

// Toggle these when you're ready to enforce inventory/prices
const CHECK_STOCK   = false; // when true: block if on_hand < qty and decrement on success
const REQUIRE_PRICE = false; // when true: missing price -> error

type LineItem   = { sku: string; qty: number };
type ShippingIn = { method?: string; fee?: number; notes?: string };
type OrderIn = {
  name: string; email: string; address1: string;
  city: string; state: string; zip: string;
  payment: 'Square' | 'Venmo' | 'CashApp' | 'BTC' | 'ETH' | 'XMR' | 'Other';
  items: LineItem[];
  shipping?: ShippingIn;
};

// If you don't store price in inventory.json, define here.
// (If price exists in inventory.json, that wins.)
const priceList: Record<string, number> = {
  // RT10: 80,
  // RT15: 95,
  // TB10: 45,
  // CG05: 35,
  // CG10: 60,
  // TS10: 50,
};

async function ensureFiles() {
  await fs.mkdir(dataDir, { recursive: true });

  try { await fs.access(invPath); }      catch { await fs.writeFile(invPath, '[]', 'utf8'); }
  try { await fs.access(ordersPath); }   catch { await fs.writeFile(ordersPath, '[]', 'utf8'); }
  try { await fs.access(csvPath); } catch {
    const header = [
      'Timestamp','Order No','Payment','Name','Email','Address',
      'Items','Subtotal','Shipping','Total',
      // you can add more columns later (e.g., Payment Status / Ref / Handle)
      'Raw JSON'
    ].join(',') + '\n';
    await fs.writeFile(csvPath, header, 'utf8');
  }
}

function csvEscape(val: any): string {
  const s = String(val ?? '');
  const needsQuotes = /[",\n]/.test(s) || s.startsWith(' ') || s.endsWith(' ');
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function formatItems(items: LineItem[]): string {
  return items.map(i => `${i.sku}x${i.qty}`).join('; ');
}

export async function POST(req: Request) {
  try {
    await ensureFiles();
    const body = (await req.json()) as OrderIn;

    // Basic shape checks
    if (!body?.items?.length) {
      return new Response(JSON.stringify({ ok:false, error:'no_items' }), {
        status: 400, headers:{ 'content-type':'application/json' }
      });
    }

    // Load data
    const [invText, ordText] = await Promise.all([
      fs.readFile(invPath, 'utf8'),
      fs.readFile(ordersPath, 'utf8'),
    ]);

    type InvItem = { sku: string; on_hand: number; price?: number; [k: string]: any };
    const inventory: InvItem[] = invText.trim() ? JSON.parse(invText) : [];
    const orders: any[]        = ordText.trim() ? JSON.parse(ordText) : [];

    // Validate + compute subtotal
    let subtotal = 0;
    for (const { sku, qty } of body.items) {
      const item = inventory.find(i => i.sku === sku);
      if (!item) {
        return Response.json({ ok:false, error:`unknown_sku:${sku}` }, { status: 400 });
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return Response.json({ ok:false, error:`bad_qty:${sku}` }, { status: 400 });
      }

      if (CHECK_STOCK && item.on_hand < qty) {
        return Response.json({ ok:false, error:`insufficient_stock:${sku}`, on_hand:item.on_hand }, { status: 409 });
      }

      const unitPrice =
        Number.isFinite(item.price) ? Number(item.price) :
        (sku in priceList ? priceList[sku] : (REQUIRE_PRICE ? NaN : 0));

      if (!Number.isFinite(unitPrice)) {
        return Response.json({ ok:false, error:`missing_price:${sku}` }, { status: 400 });
      }

      subtotal += unitPrice * qty;
    }

    // Decrement stock only if enforcing inventory
    if (CHECK_STOCK) {
      for (const { sku, qty } of body.items) {
        const item = inventory.find(i => i.sku === sku)!;
        item.on_hand -= qty;
      }
    }

    // Normalize shipping (defaults)
    const shipping = {
      method: body.shipping?.method || 'USPS Priority',
      fee: Number.isFinite(body.shipping?.fee) ? Number(body.shipping!.fee) : 10,
      notes: body.shipping?.notes || ''
    };

    const total = subtotal + shipping.fee;

    // Compose order record
    const ts = Date.now();
    const order_id = `ord_${ts.toString(36)}`;
    const iso = new Date(ts).toISOString();

    const orderRec = {
      order_id,
      ts,
      ...body,
      shipping,
      subtotal,
      total,
      // (future) payment fields you might add:
      // payment_status: 'pending',
      // amount_received: 0,
      // payment_ref: '',
      // payer_handle: '',
    };

    orders.push(orderRec);

    // Persist JSON (only write inventory if we changed it)
    if (CHECK_STOCK) {
      await fs.writeFile(invPath, JSON.stringify(inventory, null, 2), 'utf8');
    }
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

    // Append CSV row
    const addr = `${body.address1}, ${body.city}, ${body.state} ${body.zip}`;
    const itemsStr = formatItems(body.items);
    const rawCompact = JSON.stringify(orderRec); // one line

    const row = [
      csvEscape(iso),
      csvEscape(order_id),
      csvEscape(body.payment),
      csvEscape(body.name),
      csvEscape(body.email),
      csvEscape(addr),
      csvEscape(itemsStr),
      csvEscape(subtotal.toFixed(2)),
      csvEscape(shipping.fee.toFixed(2)),
      csvEscape(total.toFixed(2)),
      csvEscape(rawCompact),
    ].join(',') + '\n';

    await fs.appendFile(csvPath, row, 'utf8');

    return Response.json({ ok:true, order_id, total, shipping }, { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok:false, error:e?.message || 'server_error' }), {
      status: 500, headers:{ 'content-type':'application/json' }
    });
  }
}


