import { promises as fs } from 'fs';
import path from 'path';

type ConfirmIn = {
  order_id: string;
  amount_received?: number;   // in USD
  payment_ref?: string;       // tx hash / venmo id / square invoice id
  payer_handle?: string;      // @venmo / $cashapp / wallet addr
  mark_paid?: boolean;        // default true
};

export async function POST(req: Request) {
  const ordersPath = path.join(process.cwd(), 'data', 'orders.json');
  try {
    const body = (await req.json()) as ConfirmIn;
    if (!body.order_id) {
      return Response.json({ ok:false, error:'missing_order_id' }, { status: 400 });
    }

    const txt = await fs.readFile(ordersPath, 'utf8');
    const orders: any[] = txt.trim() ? JSON.parse(txt) : [];
    const order = orders.find(o => o.order_id === body.order_id);
    if (!order) {
      return Response.json({ ok:false, error:'order_not_found' }, { status: 404 });
    }

    if (typeof body.amount_received === 'number' && isFinite(body.amount_received)) {
      order.amount_received = body.amount_received;
    }
    if (typeof body.payment_ref === 'string') {
      order.payment_ref = body.payment_ref;
    }
    if (typeof body.payer_handle === 'string') {
      order.payer_handle = body.payer_handle;
    }
    if (body.mark_paid !== false) {
      order.payment_status = 'paid';
    }

    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8');

    // (Optional) also append a line to your CSV reflecting updated fields if you want a change log.
    return Response.json({ ok:true, order });
  } catch (e:any) {
    return Response.json({ ok:false, error:e?.message || 'server_error' }, { status: 500 });
  }
}
