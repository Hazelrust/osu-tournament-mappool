import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.VITE_OSU_CLIENT_ID,
        client_secret: process.env.OSU_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.VITE_BASE_URL || 'http://localhost:5173'}/api/auth/callback`
      })
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token fetch failed');

    // Fetch user ID
    const userRes = await fetch('https://osu.ppy.sh/api/v2/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    // Create session JWT
    const sessionToken = jwt.sign(
      { osu_id: userData.id, username: userData.username, access_token: tokenData.access_token },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.setHeader('Set-Cookie', serialize('osu_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }));

    res.redirect('/');
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
