export default async function handler(req: any, res: any) {
  const url = new URL(req.url as string, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'Beatmap ID required' });

  try {
    // 1. Get Client Credentials Token
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
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) throw new Error('Failed to auth');

    // 2. Fetch Beatmap Data
    const mapRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${id}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const mapData = await mapRes.json();
    return res.status(200).json(mapData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
