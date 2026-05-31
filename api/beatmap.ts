import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let id = req.query.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Beatmap ID required' });

  try {
    // 1. Get Client Credentials Token
    if (!cachedToken || Date.now() >= tokenExpiresAt) {
      const tokenRes = await fetch('https://osu.ppy.sh/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.OSU_CLIENT_ID,
          client_secret: process.env.OSU_CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'public'
        })
      });

      if (!tokenRes.ok) throw new Error(`Failed to fetch token: ${tokenRes.statusText}`);
      
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('Failed to auth');

      cachedToken = tokenData.access_token;
      tokenExpiresAt = Date.now() + ((tokenData.expires_in || 86400) - 60) * 1000;
    }

    // 2. Fetch Beatmap Data
    const mapRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${id}`, {
      headers: {
        'Authorization': `Bearer ${cachedToken}`
      }
    });

    if (!mapRes.ok) {
      const errorData = await mapRes.text();
      try {
        return res.status(mapRes.status).json(JSON.parse(errorData));
      } catch {
        return res.status(mapRes.status).send(errorData);
      }
    }
    
    const mapData = await mapRes.json();
    return res.status(200).json(mapData);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: 'An unknown error occurred' });
  }
}
