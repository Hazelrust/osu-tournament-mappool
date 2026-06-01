import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = parse(req.headers.cookie || '');
  if (!cookies.osu_session) return res.status(401).json({ error: 'Unauthorized' });

  let session: any;
  try {
    session = jwt.verify(cookies.osu_session, process.env.JWT_SECRET || 'fallback_secret');
  } catch (e) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    // Fetch recent scores from osu API
    const osuRes = await fetch(`https://osu.ppy.sh/api/v2/users/${session.osu_id}/scores/recent?limit=50&include_fails=1`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    
    if (!osuRes.ok) throw new Error('Failed to fetch from osu api');
    const recentScores = await osuRes.json();

    const userKey = `user:${session.osu_id}:performance`;
    let records: any[] = (await kv.get(userKey)) || [];
    let updatedCount = 0;

    for (const score of recentScores) {
      const beatmapId = score.beatmap.id;
      const newScore = score.score;
      const acc = score.accuracy * 100;
      const misses = score.statistics.count_miss || 0;

      const existingIndex = records.findIndex(r => r.beatmapId === beatmapId);
      
      // Only update if it's a new map, or the score is higher than saved
      if (existingIndex < 0 || records[existingIndex].score < newScore) {
        const newRecord = {
          beatmapId,
          score: newScore,
          accuracy: acc,
          missCount: misses,
          confidence: existingIndex >= 0 ? records[existingIndex].confidence : 'practicing',
          lastUpdated: new Date().toISOString(),
          isManual: false
        };

        if (existingIndex >= 0) {
          records[existingIndex] = newRecord;
        } else {
          records.push(newRecord);
        }
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await kv.set(userKey, records);
    }

    return res.status(200).json({ synced: updatedCount, records });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' });
  }
}
