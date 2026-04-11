export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const WEBHOOK_URL = 'https://' + process.env.VERCEL_URL + '/api/webhook';
  const r = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/setWebhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: WEBHOOK_URL, drop_pending_updates: true })
  });
  res.status(200).json({ result: await r.json(), webhook_url: WEBHOOK_URL });
}
