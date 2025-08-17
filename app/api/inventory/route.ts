export const dynamic = 'force-dynamic';

import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const invPath = path.join(dataDir, 'inventory.json');

async function ensureFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(invPath); }
  catch {
    const seed = [
      { sku: 'RT10', name: 'Retatrutide 10mg', on_hand: 20, price_cents: 13500 },
      { sku: 'RT15', name: 'Retatrutide 15mg', on_hand: 20, price_cents: 16000 },
      { sku: 'GL70', name: 'Glow70 50mg blend', on_hand: 20, price_cents: 9500 }
    ];
    await fs.writeFile(invPath, JSON.stringify(seed, null, 2), 'utf8');
  }
}

export async function GET() {
  try {
    await ensureFiles();
    const text = await fs.readFile(invPath, 'utf8');
    return new Response(text, { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok:false, error:e?.message, path:invPath }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}

