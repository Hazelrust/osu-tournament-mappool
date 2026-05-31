import { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

let cachedToken = '';
let tokenExpiresAt = 0;

const SHEET1_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?output=csv';
const SHEET2_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?gid=97481118&single=true&output=csv';

const DELETED_MAP_IDS = ["4376789", "4384670", "4393055"];

function extractBeatmapId(url: string) {
  const match = url.match(/(?:#osu\/|beatmaps\/)(\d+)/);
  return match ? match[1] : null;
}

function calculateMods(baseStats: any, modStr: string) {
  const mod = modStr.toUpperCase().replace(/[0-9]/g, '');
  let { cs, ar, accuracy: od, drain: hp, bpm } = baseStats;
  
  if (mod.includes('HR')) {
    cs = Math.min(10, cs * 1.3);
    ar = Math.min(10, ar * 1.4);
    od = Math.min(10, od * 1.4);
    hp = Math.min(10, hp * 1.4);
  } else if (mod.includes('DT')) {
    bpm = bpm * 1.5;
    const msAr = 1200 - 150 * (ar > 5 ? ar - 5 : ar);
    const dtMsAr = msAr / 1.5;
    ar = dtMsAr < 300 ? 11 : (dtMsAr < 1200 ? 5 + (1200 - dtMsAr) / 150 : 5);
    od = Math.min(11, od + 2); 
  } else if (mod.includes('EZ')) {
    cs = cs / 2;
    ar = ar / 2;
    od = od / 2;
    hp = hp / 2;
  }
  
  return { cs: Number(cs.toFixed(1)), ar: Number(ar.toFixed(1)), od: Number(od.toFixed(1)), hp: Number(hp.toFixed(1)), bpm: Math.round(bpm) };
}

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
  try {
    const token = await getOsuToken();

    // 1. Fetch Google Sheets CSV
    const [res1, res2] = await Promise.all([
      fetch(`${SHEET1_URL}&t=${Date.now()}`),
      fetch(`${SHEET2_URL}&t=${Date.now()}`)
    ]);
    
    const text1 = await res1.text();
    const text2 = await res2.text();

    const data1 = Papa.parse(text1, { header: true, skipEmptyLines: true }).data.map((r: any) => ({ ...r, Tournament: 'OWC 2023' }));
    
    // Sheet 2 now has headers (Tournament, Mod, Map URL)
    const data2 = Papa.parse(text2, { header: true, skipEmptyLines: true }).data;
    
    const combinedData = [...data1, ...data2];
    
    // 2. Map items and prepare osu! IDs
    const validRows = [];
    const seenMaps = new Set<string>();

    // Filter valid rows and find missing ones
    for (const row of combinedData) {
      const modSlot = row['Mod'];
      const mapUrl = row['Map URL'];
      const tournament = row['Tournament'] || row[0] || 'Unknown';
      
      let beatmapId = null;
      if (mapUrl && typeof mapUrl === 'string') {
        const match = mapUrl.match(/(?:#osu\/|beatmaps\/|b\/)(\d+)/);
        beatmapId = match ? match[1] : null;
      }
      
      if (!beatmapId || DELETED_MAP_IDS.includes(beatmapId)) continue;
      
      // Deduplicate maps within the same tournament
      const uniqueKey = `${tournament}-${beatmapId}`;
      if (seenMaps.has(uniqueKey)) continue;
      seenMaps.add(uniqueKey);
      
      validRows.push({ row, beatmapId, modSlot });
    }

    // 3. Process maps in bulk to avoid rate limiting
    // osu! API allows up to 50 beatmaps per request
    const chunkSize = 50;
    const finalResult = [];
    
    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);
      const queryParams = chunk.map(c => `ids[]=${c.beatmapId}`).join('&');
      
      const bulkRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!bulkRes.ok) {
        console.error("Bulk fetch failed:", await bulkRes.text());
        continue;
      }
      
      const bulkData = await bulkRes.json();
      const beatmaps = bulkData.beatmaps || [];
      
      // Match returned maps back to their rows
      for (const mapData of beatmaps) {
        const rowData = chunk.find(c => String(c.beatmapId) === String(mapData.id));
        if (!rowData) continue;
        const modSlot = rowData.modSlot;
        
        const calculatedStats = calculateMods({
          cs: mapData.cs,
          ar: mapData.ar,
          accuracy: mapData.accuracy,
          drain: mapData.drain,
          bpm: mapData.bpm
        }, modSlot);

        finalResult.push({
          ...mapData,
          calculatedStats,
          modSlot,
          tournament: rowData.row['Tournament'] || rowData.row[0] || 'Unknown' // Handle both object and array formats
        });
      }
    }

    // Cache the finished mappool array heavily. The stale-while-revalidate directive ensures users instantly get 
    // the cached version while Vercel re-fetches from osu! API and Google Sheets in the background.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json(finalResult);

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
