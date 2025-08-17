'use client';
import { useSearchParams } from 'next/navigation';

export default function VenmoPay() {
  const sp = useSearchParams();
  const order = sp.get('order') ?? '';
  const total = sp.get('total') ?? '';

  const venmoUser = 'YourVenmoUser';
  const note = `Order ${order}`;
  const venmoDeep = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(venmoUser)}&amount=${encodeURIComponent(total)}&note=${encodeURIComponent(note)}`;
  const venmoWeb  = `https://venmo.com/${encodeURIComponent(venmoUser)}?txn=pay&amount=${encodeURIComponent(total)}&note=${encodeURIComponent(note)}`;

  return (
    <main style={{padding:16,maxWidth:480,margin:'0 auto'}}>
      <h1>Pay with Venmo</h1>
      <p>Order: <b>{order}</b></p>
      <p>Total: <b>${total}</b></p>
      <a href={venmoDeep}>Open Venmo App</a><br/>
      <a href={venmoWeb}>Use Venmo Web</a>
      <p style={{opacity:.7,marginTop:8}}>Put “Order {order}” in the note.</p>
    </main>
  );
}

