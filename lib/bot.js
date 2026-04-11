import { sendMessage, sendVideo, sendChatAction, getFileUrl } from './telegram.js';
import { runLivePortrait } from './liveportrait.js';

const sessions = {};

export async function processUpdate(update) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text?.startsWith('/start')) {
    return sendMessage(chatId, '🎭 <b>LivePortrait Bot!</b>\n\n1️⃣ Portrait <b>photo</b> bhejein\n2️⃣ Driving <b>video</b> bhejein\n✨ AI aapki photo animate karega!');
  }
  if (msg.text?.startsWith('/reset')) {
    delete sessions[userId];
    return sendMessage(chatId, '🔄 Reset! Ab nayi photo bhejein.');
  }
  if (msg.photo) {
    const best = msg.photo[msg.photo.length - 1];
    sessions[userId] = { photoUrl: await getFileUrl(best.file_id), ts: Date.now() };
    return sendMessage(chatId, '✅ <b>Photo mili!</b> Ab driving video bhejein. 🎬');
  }
  if (msg.video || msg.animation || msg.document?.mime_type?.startsWith('video/')) {
    const v = msg.video || msg.animation || msg.document;
    if (!sessions[userId]?.photoUrl) return sendMessage(chatId, '⚠️ Pehle portrait <b>photo</b> bhejein!');
    if (Date.now() - sessions[userId].ts > 1800000) {
      delete sessions[userId];
      return sendMessage(chatId, '⏰ Session expire. Photo dubara bhejein.');
    }
    await sendMessage(chatId, '⏳ <b>Processing...</b> 1-3 min lagenge 🙏');
    await sendChatAction(chatId, 'upload_video');
    try {
      const videoUrl = await runLivePortrait(sessions[userId].photoUrl, await getFileUrl(v.file_id));
      delete sessions[userId];
      return sendVideo(chatId, videoUrl, '✨ Aapka animated portrait! 🎭');
    } catch(e) {
      return sendMessage(chatId, '❌ Error: ' + e.message + '\n/reset karke dobara try karein.');
    }
  }
  if (msg.text) return sendMessage(chatId, '📸 Photo ya 🎥 video bhejein.\n/start - help');
}
