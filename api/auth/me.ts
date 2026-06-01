import { VercelRequest, VercelResponse } from '@vercel/node';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionToken = cookies.osu_session;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(sessionToken, secret) as any;

    return res.status(200).json({
      osu_id: decoded.osu_id,
      username: decoded.username
    });
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid session' });
  }
}
