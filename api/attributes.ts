import { VercelRequest, VercelResponse } from '@vercel/node';

let cachedToken = '';
let tokenExpiresAt = 0;

async function getOsuToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.VITE_OSU_CLIENT_ID || process.env.OSU_CLIENT_ID,
      client_secret: process.env.VITE_OSU_CLIENT_SECRET || process.env.OSU_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'public'
    })
  });
  
  const data = await res.json();
  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  }
  throw new Error("Failed to get token");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, mods } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Beatmap ID required' });
  }

  // Parse mods from a comma separated string (e.g., ?mods=HD,HR)
  const modArray = typeof mods === 'string' && mods ? mods.split(',') : [];

  try {
    const token = await getOsuToken();

    // The attributes endpoint requires a POST request
    const attrRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${id}/attributes`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mods: modArray, ruleset: 'osu' })
    });

    if (!attrRes.ok) {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(attrRes.status).json({ error: 'Attributes not found' });
    }

    const attrData = await attrRes.json();
    
    // Cache success responses globally on Vercel's Edge Network for 24 hours
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(attrData);
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
