'use client';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage(){
  const q = useSearchParams();
  const order = q.get('order') || 'UNKNOWN';
  return (
    <main style={{minHeight:'70dvh',display:'grid',placeItems:'center',padding:24}}>
      <div style={{maxWidth:560,background:'#FAF8F6',border:'1px solid rgba(0,0,0,.12)',borderRadius:16,padding:20}}>
        <h1 style={{marginTop:0}}>Thanks — payment received</h1>
        <p>Order <b>{order}</b> is being prepped for shipping.</p>
      </div>
    </main>
  );
}
