import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.VITE_OSU_CLIENT_ID || process.env.OSU_CLIENT_ID;
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/auth/callback`;
    const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=public+identify`;
    
    res.redirect(authUrl);
  } catch (err: any) {
    res.status(500).send(`Login Error: ${err.message}\n${err.stack}`);
  }
}
