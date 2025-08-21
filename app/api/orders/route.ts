export const runtime = "nodejs";

function round2(n: number) { return Math.round(n * 100) / 100; }
function newId() { return "BD" + Math.random().toString(36).slice(2, 8).toUpperCase(); }

// Authoritative server prices (mirror your UI)
const PRICE_BY_SKU: Record<string, number> = {
  RT10:70, RT15:85, RT20:100, RT30:120, CG05:35, CG10:60,
  GL70:85, BB20:70, BC10:25, TB10:45, NAD5:40, ET10:25, MS10:30,
  CU50:20, AU100:40, TSM10:50, IP10:30, SK10:23, SX10:23, P141:25,
  BW30:15, BW10:8, BW03:4, SY10:5, SY05:5, SY03:5, SY23:1, AW19:5,
};

const FREE_SHIP_THRESHOLD = 200;
const FLAT_SHIP = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, address1, city, state, zip, items, payment } = body || {};

    if (!name || !email || !address1 || !city || !state || !zip) {
      return Response.json({ ok:false, error:"Missing shipping fields" }, { status:400 });
    }
    if (!Array.isArray(items) || !items.length) {
      return Response.json({ ok:false, error:"Empty cart" }, { status:400 });
    }

    let subtotal = 0;
    for (const it of items) {
      const sku = String(it?.sku ?? "");
      const qty = Math.max(0, Number(it?.qty ?? 0));
      const unit = PRICE_BY_SKU[sku] ?? 0;
      subtotal += unit * qty;
    }
    if (subtotal <= 0) return Response.json({ ok:false, error:"Invalid cart" }, { status:400 });

    const shipping = subtotal > FREE_SHIP_THRESHOLD ? 0 : (items.length ? FLAT_SHIP : 0);
    const total = round2(subtotal + shipping);
    const order_id = newId();

    const method = String(payment || "square").toLowerCase();
    const redirect = `/pay/${method}?order=${order_id}&total=${total}`;

    return Response.json({ ok:true, order_id, total, redirect });
  } catch {
    return Response.json({ ok:false, error:"server_error" }, { status:500 });
  }
}
