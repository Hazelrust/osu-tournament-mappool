import { VercelRequest, VercelResponse } from '@vercel/node';

let cachedToken = '';
let tokenExpiresAt = 0;

async function getOsuToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  
  try {
    const res = await fetch('https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Number((process.env.VITE_OSU_CLIENT_ID || process.env.OSU_CLIENT_ID || '').trim()),
        client_secret: (process.env.VITE_OSU_CLIENT_SECRET || process.env.OSU_CLIENT_SECRET || '').trim(),
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
    return null;
  } catch (err) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || !Array.isArray(body.maps)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const token = await getOsuToken();
    if (!token) {
      return res.status(200).json({ results: [] });
    }

    const results = [];

    // Limit concurrency to prevent slamming the osu! API
    // Process in batches of 10
    const chunkSize = 10;
    for (let i = 0; i < body.maps.length; i += chunkSize) {
      const chunk = body.maps.slice(i, i + chunkSize);
      
      const promises = chunk.map(async (m: { id: string, mods: string }) => {
        const modStr = (m.mods || '').toUpperCase();
        const modsObj: any[] = [];
        
        if (modStr.includes('DT')) modsObj.push({ acronym: 'DT' });
        else if (modStr.includes('NC')) modsObj.push({ acronym: 'NC' });
        else if (modStr.includes('HT')) modsObj.push({ acronym: 'HT' });
        
        if (modStr.includes('HR')) modsObj.push({ acronym: 'HR' });
        else if (modStr.includes('EZ')) modsObj.push({ acronym: 'EZ' });

        if (modsObj.length === 0) return { id: m.id, star_rating: null };

        try {
          const attrRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${m.id}/attributes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruleset: "osu", mods: modsObj })
          });
          
          if (attrRes.ok) {
            const attr = await attrRes.json();
            return { id: m.id, star_rating: attr.attributes?.star_rating };
          }
        } catch (e) {
          // ignore
        }
        return { id: m.id, star_rating: null };
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    // Cache the result for 24 hours on Vercel Edge
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json({ results });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
