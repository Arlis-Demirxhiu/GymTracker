/**
 * Confirms every picked video still exists and still allows embedding,
 * using YouTube's public oEmbed endpoint (200 = fine, 401 = embedding turned
 * off, 404 = removed). Run with: npm run check-videos
 */
import { VIDEOS } from './videos.ts';

const check = async (videoId: string) => {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const res = await fetch(url);
  return res.status;
};

const results = await Promise.all(
  Object.entries(VIDEOS).map(async ([exercise, video]) => ({ exercise, video, status: await check(video.videoId) })),
);
const broken = results.filter((r) => r.status !== 200);
for (const r of broken) console.log(`✖ ${r.exercise}: ${r.video.videoId} → HTTP ${r.status}`);
console.log(`${results.length - broken.length}/${results.length} videos embeddable`);
process.exit(broken.length ? 1 : 0);
