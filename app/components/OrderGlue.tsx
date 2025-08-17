'use client';

import { useEffect } from 'react';

type Item = { sku: string; qty: number };

function collectItems(): Item[] {
  // Finds qty inputs by any of these patterns:
  //  data-sku="RT10"  |  name="qty[RT10]"  |  name="qty-RT10"
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[data-sku], input[name^="qty["], input[name^="qty-"]'
    )
  );
  const items: Item[] = [];
  for (const el of inputs) {
    const qty = Number(el.value);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const sku =
      el.dataset.sku ||
      (el.name.startsWith('qty[') ? el.name.slice(4, -1) : el.name.replace(/^qty-/, ''));

    if (sku) items.push({ sku, qty });
  }
  return items;
}

export default function OrderGlue() {
  useEffect(() => {
    const form = document.getElementById('bodhi-order-form') as HTMLFormElement | null;
    if (!form) return; // TS: we exit early if null

    // Type the listener as a generic Event to satisfy addEventListener/removeEventListener.
    const onSubmit = async (evt: Event) => {
      evt.preventDefault();

      // Narrow currentTarget to HTMLFormElement
      const formEl = (evt.currentTarget as HTMLFormElement | null) ?? form;

      const items = collectItems();
      if (!items.length) {
        alert('Add at least one item.');
        return;
      }

      const fd = new FormData(formEl); // safe: formEl is not null here

      const payload = {
        name:     String(fd.get('name')     ?? ''),
        email:    String(fd.get('email')    ?? ''),
        address1: String(fd.get('address1') ?? ''),
        city:     String(fd.get('city')     ?? ''),
        state:    String(fd.get('state')    ?? ''),
        zip:      String(fd.get('zip')      ?? ''),
        payment:  String(fd.get('payment')  ?? 'Venmo') as 'Venmo' | 'CashApp' | 'Zelle' | 'Other',
        items,
        // Optional override; backend defaults to USPS Priority $10:
        // shipping: { method: 'USPS Priority', fee: 10 },
      };

      const submitBtn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing…'; }

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        // Success → redirect with order + total
        const q = new URLSearchParams({ order: json.order_id, total: String(json.total) }).toString();
        if (payload.payment === 'Venmo')       window.location.href = `/pay/venmo?${q}`;
        else if (payload.payment === 'CashApp') window.location.href = `/pay/cashapp?${q}`;
        else if (payload.payment === 'Zelle')   window.location.href = `/pay/zelle?${q}`;
        else alert(`Order ${json.order_id} created. Total $${json.total}.`);
      } catch (err: any) {
        alert(`Order error: ${err?.message || String(err)}`);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
      }
    };

    // Cast to EventListener to quiet TS, since we typed evt as Event.
    form.addEventListener('submit', onSubmit as EventListener);
    return () => { form.removeEventListener('submit', onSubmit as EventListener); };
  }, []);

  return null;
}
