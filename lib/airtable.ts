export const AIR = {
    BASE: process.env.AIRTABLE_BASE_ID!,
    TOKEN: process.env.AIRTABLE_TOKEN!,
    TBL_PRODUCTS: process.env.AIRTABLE_PRODUCTS_TABLE || 'Products',
    TBL_ORDERS: process.env.AIRTABLE_ORDERS_TABLE || 'Orders',
    TBL_ITEMS: process.env.AIRTABLE_ITEMS_TABLE || 'Order Items',
    TBL_CLIENTS: process.env.AIRTABLE_CLIENTS_TABLE || '',
  };
  
  function assertEnv() {
    if (!AIR.BASE || !AIR.TOKEN) throw new Error('Airtable env not set');
  }
  function api(table: string, qs?: Record<string,string>) {
    const base = `https://api.airtable.com/v0/${AIR.BASE}/${encodeURIComponent(table)}`;
    if (!qs) return base;
    const q = new URLSearchParams(qs);
    return `${base}?${q.toString()}`;
  }
  async function atFetch(url: string, init?: RequestInit) {
    assertEnv();
    const r = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${AIR.TOKEN}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = j?.error?.message || j?.errors?.[0]?.message || `Airtable ${r.status}`;
      throw new Error(msg);
    }
    return j as any;
  }
  
  // ---------- Public helpers ----------
  
  export type AirRecord<T = any> = { id: string; fields: T };
  export async function listProductsBasic() {
    const fields = ['SKU','Price','Remaining','OnHand','Reserved'];
    const j = await atFetch(api(AIR.TBL_PRODUCTS, { 'fields[]': fields.join('&fields[]=') }) );
    return (j.records as AirRecord[]).map(r => ({
      id: r.id,
      sku: r.fields['SKU'],
      price: Number(r.fields['Price'] || 0),
      remaining: Number(
        r.fields['Remaining'] ?? (Number(r.fields['OnHand']||0) - Number(r.fields['Reserved']||0))
      ),
      reserved: Number(r.fields['Reserved'] || 0),
    }));
  }
  
  export async function getProductsBySKUs(skus: string[]) {
    if (!skus.length) return [];
    // Build OR({SKU}='RT10', {SKU}='TB10', ...)
    const esc = (s: string) => s.replace(/'/g, "\\'");
    const formula = `OR(${skus.map(s => `({SKU}='${esc(s)}')`).join(',')})`;
    const j = await atFetch(api(AIR.TBL_PRODUCTS, { filterByFormula: formula }));
    return j.records as AirRecord[];
  }
  
  export async function patchProductsReserved(updates: Array<{ id: string; newReserved: number }>) {
    if (!updates.length) return;
    await atFetch(api(AIR.TBL_PRODUCTS), {
      method: 'PATCH',
      body: JSON.stringify({
        records: updates.map(u => ({ id: u.id, fields: { Reserved: u.newReserved } })),
      }),
    });
  }
  
  export async function createOrder(fields: Record<string, any>) {
    const j = await atFetch(api(AIR.TBL_ORDERS), {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
    return j as AirRecord;
  }
  
  export async function createOrderItems(records: Array<{ fields: any }>) {
    if (!records.length) return;
    await atFetch(api(AIR.TBL_ITEMS), {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }
  
  export async function findOrderByOrderID(orderId: string) {
    const formula = `({OrderID}='${orderId.replace(/'/g, "\\'")}')`;
    const j = await atFetch(api(AIR.TBL_ORDERS, { filterByFormula: formula }));
    return (j.records as AirRecord[])[0] || null;
  }
  
  export async function listOrderItemsForOrder(orderRecId: string) {
    // filter linked record contains the order recId
    const formula = `FIND('${orderRecId}', ARRAYJOIN({Order}))`;
    const j = await atFetch(api(AIR.TBL_ITEMS, { filterByFormula: formula }));
    return j.records as AirRecord[];
  }
  
  export async function updateOrder(recId: string, fields: Record<string, any>) {
    await atFetch(api(AIR.TBL_ORDERS), {
      method: 'PATCH',
      body: JSON.stringify({ records: [{ id: recId, fields }] }),
    });
  }
  
  export async function adjustProductStock(adjustments: Array<{ productRecId: string; diffReserved: number; diffOnHand: number }>) {
    if (!adjustments.length) return;
    await atFetch(api(AIR.TBL_PRODUCTS), {
      method: 'PATCH',
      body: JSON.stringify({
        records: adjustments.map(a => ({
          id: a.productRecId,
          fields: {
            ...(a.diffReserved ? { Reserved: { __op: 'increment', value: a.diffReserved } } : {}),
            ...(a.diffOnHand ? { OnHand: { __op: 'increment', value: a.diffOnHand } } : {}),
          },
        })),
      }),
    });
  }
  
  // Airtable doesn’t officially support atomic increments via API; fallback:
  export async function patchProductsAbsolute(records: Array<{ id: string; fields: any }>) {
    if (!records.length) return;
    await atFetch(api(AIR.TBL_PRODUCTS), {
      method: 'PATCH',
      body: JSON.stringify({ records }),
    });
  }
  
  export async function findOrCreateClientByEmail(name: string, email?: string | null) {
    if (!AIR.TBL_CLIENTS || !email) return null;
    const formula = `LOWER({Email})='${String(email).toLowerCase().replace(/'/g,"\\'")}'`;
    const j = await atFetch(api(AIR.TBL_CLIENTS, { filterByFormula: formula }));
    const existing = (j.records as AirRecord[])[0];
    if (existing) return existing;
    const created = await atFetch(api(AIR.TBL_CLIENTS), {
      method: 'POST',
      body: JSON.stringify({ fields: { 'Client Name': name, Email: email } }),
    });
    return created as AirRecord;
  }
  