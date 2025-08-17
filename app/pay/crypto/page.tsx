'use client';
import { useSearchParams } from 'next/navigation';

export default function CryptoPayPage() {
  const q = useSearchParams();
  const order = q.get('order') ?? '';
  const total = q.get('total') ?? '';

  return (
    <main style={{maxWidth:700, margin:'24px auto', padding:'12px'}}>
      <h1 style={{marginBottom:6}}>Crypto Payment</h1>
      <p style={{margin:'6px 0 18px'}}>Order: <b>{order}</b> • Total: <b>${total}</b></p>

      <div style={{display:'grid', gap:12}}>
        <section style={{border:'1px solid #eee', borderRadius:12, padding:14}}>
          <h3>BTC (Bitcoin)</h3>
          <code>bc1q…your_btc_address…</code>
          <p style={{marginTop:8}}>Or open your wallet app and scan the QR on request.</p>
        </section>

        <section style={{border:'1px solid #eee', borderRadius:12, padding:14}}>
          <h3>ETH (Ethereum)</h3>
          <code>0x…your_eth_address…</code>
        </section>

        <section style={{border:'1px solid #eee', borderRadius:12, padding:14}}>
          <h3>XMR (Monero)</h3>
          <code>4A…your_xmr_address…</code>
        </section>

        <p style={{color:'#666', fontSize:13}}>
          After you send, reply to the order email with your tx hash if it doesn’t auto-match.
        </p>
      </div>
    </main>
  );
}
