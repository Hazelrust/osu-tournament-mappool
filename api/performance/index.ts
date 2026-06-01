import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || '');
  if (!cookies.osu_session) return res.status(401).json({ error: 'Unauthorized' });

  let session: any;
  try {
    session = jwt.verify(cookies.osu_session, process.env.JWT_SECRET || 'fallback_secret');
  } catch (e) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const userKey = `user:${session.osu_id}:performance`;

  if (req.method === 'GET') {
    const data = await kv.get(userKey) || [];
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const newRecord = req.body;
    let records: any[] = (await kv.get(userKey)) || [];
    
    const existingIndex = records.findIndex(r => r.beatmapId === newRecord.beatmapId);
    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...newRecord, lastUpdated: new Date().toISOString() };
    } else {
      records.push({ ...newRecord, lastUpdated: new Date().toISOString() });
    }

    await kv.set(userKey, records);
    return res.status(200).json(records);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
