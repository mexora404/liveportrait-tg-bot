import { sendMessage, sendVideo, sendChatAction, getFileUrl } from './telegram.js';
import { runLivePortrait } from './liveportrait.js';

// Vercel KV se session store karein (free tier available)
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvSet(key, value, exSeconds = 1800) {
  if (!KV_URL || !KV_TOKEN) return false;
  await fetch(`${KV_URL}/set/${key}/${encodeURIComponent(JSON.stringify(value))}?ex=${exSeconds}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  return true;
}

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await r.json();
  if (!data.result) return null;
  return JSON.parse(decodeURIComponent(data.result));
}

async function kvDel(key) {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/del/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
}

export async function processUpdate(update) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const sessionKey = `session_${userId}`;

  if (msg.text?.startsWith('/start')) {
    return sendMessage(chatId, '🎭 <b>LivePortrait Bot!</b>\n\n1️⃣ Portrait <b>photo</b> bhejein\n2️⃣ Driving <b>video</b> bhejein\n✨ AI aapki photo animate karega!');
  }
  if (msg.text?.startsWith('/reset')) {
    await kvDel(sessionKey);
    return sendMessage(chatId, '🔄 Reset! Ab nayi photo bhejein. 📸');
  }

  if (msg.photo) {
    const best = msg.photo[msg.photo.length - 1];
    await kvSet(sessionKey, { photoFileId: best.file_id, ts: Date.now() });
    return sendMessage(chatId, '✅ <b>Photo mili!</b> Ab driving video bhejein. 🎬');
  }

  if (msg.video || msg.animation || msg.document?.mime_type?.startsWith('video/')) {
    const v = msg.video || msg.animation || msg.document;
    const session = await kvGet(sessionKey);

    if (!session?.photoFileId) {
      return sendMessage(chatId, '⚠️ Pehle portrait <b>photo</b> bhejein!');
    }
    if (Date.now() - session.ts > 1800000) {
      await kvDel(sessionKey);
      return sendMessage(chatId, '⏰ Session expire. Photo dubara bhejein.');
    }

    await sendMessage(chatId, '⏳ <b>Processing...</b> 1-3 min lagenge 🙏');
    await sendChatAction(chatId, 'upload_video');

    try {
      const sourceUrl = await getFileUrl(session.photoFileId);
      const drivingUrl = await getFileUrl(v.file_id);
      const videoUrl = await runLivePortrait(sourceUrl, drivingUrl);
      await kvDel(sessionKey);
      return sendVideo(chatId, videoUrl, '✨ Aapka animated portrait! 🎭');
    } catch(e) {
      return sendMessage(chatId, '❌ Error: ' + e.message + '\n/reset karke dobara try karein.');
    }
  }

  if (msg.text) return sendMessage(chatId, '📸 Photo ya 🎥 video bhejein.\n/start - help');
}
