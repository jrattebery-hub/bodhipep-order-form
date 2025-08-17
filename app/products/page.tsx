'use client';

import React, { useMemo, useState } from 'react';
import { PRODUCT_CATALOG, type Product } from '../data/products';

/* ---------- helpers ---------- */
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

const CATEGORY_ORDER = [
  'GLP-1 Peptides',
  'Wellness Peptides',
  'Supplies',
  'Bulk Orders',
] as const;

function groupByCategory(items: Product[]) {
  const map = new Map<string, Product[]>();
  for (const p of items) {
    const key = p.category;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  // sort categories by our preferred order, then sort items by code
  return CATEGORY_ORDER
    .filter((cat) => map.has(cat))
    .map((cat) => ({
      category: cat as string,
      items: map.get(cat)!.slice().sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

function isSpecialOrder(p: Product) {
  // Mark price=0 bulk kits as special-order
  return p.category === 'Bulk Orders' || p.price === 0;
}

/* ---------- page ---------- */
export default function ProductsPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCT_CATALOG;
    return PRODUCT_CATALOG.filter((p) => {
      const hay = `${p.code} ${p.name} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">BodhiPep — Product Catalog</h1>
        <p className="text-sm text-[#5f6a63]">Browse by category. Prices shown per unit.</p>
      </header>

      {/* Search */}
      <section className="bg-white/60 rounded-2xl shadow p-4">
        <label className="text-sm block mb-2 font-medium">Search products</label>
        <input
          className="w-full rounded-xl border border-black/10 p-3"
          placeholder="Search by code, name, or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>

      {/* Groups */}
      {groups.map(({ category, items }) => (
        <section key={category} className="bg-white/60 rounded-2xl shadow p-4 space-y-3">
          <div className="text-sm font-semibold tracking-wide text-[#2a2a2a]">{category}</div>

          <div className="divide-y divide-black/10">
            {items.map((p) => (
              <div
                key={p.code}
                className="py-3 grid grid-cols-[1fr,auto] gap-3 items-center"
              >
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-[#5f6a63]">
                    {p.code} · {p.unit}
                    {isSpecialOrder(p) && (
                      <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] bg-amber-200/70 text-amber-900 align-middle">
                        special order
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm tabular-nums text-right">
                  {isSpecialOrder(p) ? 'Contact for pricing' : currency(p.price)}
                </div>
              </div>
            ))}
          </div>

          {category === 'Bulk Orders' && (
            <p className="text-xs text-[#5f6a63] pt-1">
              Tirzepatide and Semaglutide are special order items, available only in 10-vial kits. Please allow ~7 business days for sourcing and fulfillment.
            </p>
          )}
        </section>
      ))}

      {/* Quick link to order page */}
      <footer className="pt-2 text-center">
        <a
          href="/order"
          className="inline-block px-4 py-2 rounded-xl bg-[#5A7A65] text-white"
        >
          Go to Order Form
        </a>
      </footer>
    </div>
  );
}

