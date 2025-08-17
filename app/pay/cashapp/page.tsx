'use client';
import { useSearchParams } from 'next/navigation';

export default function CashAppPay() {
  const sp = useSearchParams();
  const order = sp.get('order') ?? '';
  const total = sp.get('total') ?? '';

  const cashTag = '$YourCashTag';
  const url = `https://cash.app/${cashTag.replace('$','')}?amount=${encodeURIComponent(total)}`;

  return (
    <main style={{padding:16,maxWidth:480,margin:'0 auto'}}>
      <h1>Pay with Cash App</h1>
      <p>Order: <b>{order}</b></p>
      <p>Total: <b>${total}</b></p>
      <a href={url}>Open Cash App</a>
      <p style={{opacity:.7,marginTop:8}}>Put “Order {order}” in the note.</p>
    </main>
  );
}

  