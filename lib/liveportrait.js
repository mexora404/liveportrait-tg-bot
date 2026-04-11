const SPACE = 'https://klingteam-liveportrait.hf.space';
const HF_TOKEN = process.env.HF_TOKEN;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = () => Math.random().toString(36).slice(2, 10);

async function upload(url, name) {
  const blob = await fetch(url).then(r => r.blob());
  const fd = new FormData();
  fd.append('files', blob, name);
  const headers = HF_TOKEN ? { Authorization: 'Bearer ' + HF_TOKEN } : {};
  const r = await fetch(SPACE + '/upload', { method: 'POST', headers, body: fd });
  if (!r.ok) throw new Error('Upload failed: ' + await r.text());
  return (await r.json())[0];
}

export async function runLivePortrait(sourceUrl, drivingUrl) {
  const [src, drv] = await Promise.all([
    upload(sourceUrl, 'source.jpg'),
    upload(drivingUrl, 'driving.mp4')
  ]);
  const headers = {
    'Content-Type': 'application/json',
    ...(HF_TOKEN ? { Authorization: 'Bearer ' + HF_TOKEN } : {})
  };
  const join = await fetch(SPACE + '/queue/join', {
    method: 'POST', headers,
    body: JSON.stringify({ data: [src, drv, null, true, true, true, true], fn_index: 0, session_hash: rand() })
  });
  if (!join.ok) throw new Error('Queue join failed');
  const { event_id } = await join.json();
  for (let i = 0; i < 40; i++) {
    await sleep(4000);
    const s = await fetch(SPACE + '/queue/status?event_id=' + event_id, { headers }).then(r => r.json());
    if (s.msg === 'process_completed') {
      const out = s.output?.data?.[0];
      const path = typeof out === 'string' ? out : out?.name || out?.url;
      if (!path) throw new Error('No output video');
      return path.startsWith('http') ? path : SPACE + '/file=' + path;
    }
    if (s.msg === 'error' || s.msg === 'queue_full') throw new Error('Job failed: ' + s.msg);
  }
  throw new Error('Timeout');
}
