-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  on_hand INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  customer_name TEXT,
  email TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  postal TEXT,
  country TEXT DEFAULT 'US',
  payment_method TEXT,     -- 'venmo' | 'cashapp' | 'square' | 'btc' | 'eth' | 'xmr'
  total_cents INTEGER,
  items_json TEXT,         -- JSON array of {sku, qty, price_cents}
  note TEXT,
  status TEXT DEFAULT 'new'  -- 'new' | 'packed' | 'shipped' | 'canceled'
);

-- Seed a few products (edit to match your SKUs)
INSERT OR IGNORE INTO inventory (sku, name, on_hand) VALUES
  ('RT10', 'Retatrutide 10mg', 20),
  ('RT15', 'Retatrutide 15mg', 20),
  ('GL70', 'Glow70 50mg blend', 20);
