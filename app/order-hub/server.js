import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { nanoid } from 'nanoid';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_KEY = process.env.ADMIN_KEY || 'dev_admin_key';

app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(express.static('public'));

/** Helpers */
const getInventoryStmt = db.prepare(`SELECT sku, name, on_hand FROM inventory ORDER BY name`);
const getOneInventoryStmt = db.prepare(`SELECT sku, name, on_hand FROM inventory WHERE sku = ?`);
const decInventoryStmt = db.prepare(`UPDATE inventory SET on_hand = on_hand - ?, updated_at = datetime('now') WHERE sku = ? AND on_hand >= ?`);
const incInventoryStmt = db.prepare(`UPDATE inventory SET on_hand = on_hand + ?, updated_at = datetime('now') WHERE sku = ?`);
const upsertInventoryStmt = db.prepare(`
  INSERT INTO inventory (sku, name, on_hand, updated_at)
  VALUES (@sku, @name, @on_hand, datetime('now'))
  ON CONFLICT(sku) DO UPDATE SET name=excluded.name, on_hand=excluded.on_hand, updated_at=datetime('now')
`);
const insertOrderStmt = db.prepare(`
  INSERT INTO orders (id, customer_name, email, address1, address2, city, state, postal, country, payment_method, total_cents, items_json, note, status)
  VALUES (@id, @customer_name, @email, @address1, @address2, @city, @state, @postal, @country, @payment_method, @total_cents, @items_json, @note, 'new')
`);
const listOrdersStmt = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`);

/** Public: inventory for the form */
app.get('/api/inventory', (req, res) => {
  const rows = getInventoryStmt.all();
  res.json(rows);
});

/** Public: create order + decrement stock atomically */
app.post('/api/order', (req, res) => {
  const {
    customer_name,
    email,
    address1,
    address2 = '',
    city,
    state,
    postal,
    country = 'US',
    payment_method,
    items = [],         // [{sku, qty, price_cents}]
    note = '',
    total_cents
  } = req.body || {};

  if (!customer_name || !address1 || !city || !state || !postal || !payment_method || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const tx = db.transaction(() => {
      // Check each item has sufficient stock, then decrement
      for (const { sku, qty } of items) {
        if (!sku || !qty || qty <= 0) throw new Error('Bad item');
        const current = getOneInventoryStmt.get(sku);
        if (!current) throw new Error(`Unknown SKU: ${sku}`);
        const resDec = decInventoryStmt.run(qty, sku, qty);
        if (resDec.changes === 0) throw new Error(`Insufficient stock for ${sku}`);
      }
      const id = nanoid(10).toUpperCase();
      insertOrderStmt.run({
        id,
        customer_name,
        email: email || '',
        address1,
        address2,
        city,
        state,
        postal,
        country,
        payment_method,
        total_cents: Number.isFinite(total_cents) ? total_cents : null,
        items_json: JSON.stringify(items),
        note
      });
      return id;
    });

    const orderId = tx();
    res.json({ ok: true, order_id: orderId });
  } catch (e) {
    return res.status(409).json({ error: e.message });
  }
});

/** Admin: list orders */
app.get('/api/admin/orders', (req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  res.json(listOrdersStmt.all());
});

/** Admin: set inventory count (upsert) */
app.post('/api/admin/inventory', (req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  const { sku, name, on_hand } = req.body || {};
  if (!sku || !name || typeof on_hand !== 'number') return res.status(400).json({ error: 'bad payload' });
  upsertInventoryStmt.run({ sku, name, on_hand });
  res.json({ ok: true });
});

/** Admin: adjust inventory +/- */
app.post('/api/admin/inventory/adjust', (req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  const { sku, delta } = req.body || {};
  if (!sku || typeof delta !== 'number') return res.status(400).json({ error: 'bad payload' });
  if (delta === 0) return res.json({ ok: true });

  try {
    const tx = db.transaction(() => {
      if (delta > 0) {
        incInventoryStmt.run(delta, sku);
      } else {
        const abs = Math.abs(delta);
        const resDec = decInventoryStmt.run(abs, sku, abs);
        if (resDec.changes === 0) throw new Error(`Insufficient stock for ${sku}`);
      }
    });
    tx();
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Order Hub listening on :${PORT}`);
});

