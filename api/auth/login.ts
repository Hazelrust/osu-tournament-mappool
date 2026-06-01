import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.VITE_OSU_CLIENT_ID;
  const redirectUri = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/auth/callback`;
  const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=public`;
  
  res.redirect(authUrl);
}
