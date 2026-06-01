import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.VITE_OSU_CLIENT_ID;
  const redirectUri = `${process.env.VITE_BASE_URL || 'http://localhost:5173'}/api/auth/callback`;
  const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=public`;
  
  res.redirect(authUrl);
}
