import { processUpdate } from '../lib/bot.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, message: 'Bot is running!' });
  try { await processUpdate(req.body); } catch(e) { console.error(e); }
  res.status(200).json({ ok: true });
}
