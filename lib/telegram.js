const BASE = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN;
const FILE_BASE = 'https://api.telegram.org/file/bot' + process.env.BOT_TOKEN;
const post = (path, body) => fetch(BASE + path, {
  method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
}).then(r => r.json());
export const sendMessage = (id, text) => post('/sendMessage', { chat_id: id, text, parse_mode: 'HTML' });
export const sendVideo = (id, video, caption='') => post('/sendVideo', { chat_id: id, video, caption });
export const sendChatAction = (id, action='typing') => post('/sendChatAction', { chat_id: id, action });
export async function getFileUrl(fileId) {
  const r = await fetch(BASE + '/getFile?file_id=' + fileId).then(r => r.json());
  if (!r.ok) throw new Error('File not found');
  return FILE_BASE + '/' + r.result.file_path;
}
