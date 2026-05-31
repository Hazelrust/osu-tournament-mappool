import { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

let cachedToken = '';
let tokenExpiresAt = 0;

const SHEET1_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?output=csv';
const SHEET2_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?gid=1413426737&single=true&output=csv';

const DELETED_MAP_IDS = ["4376789", "4384670", "4393055"];

// Standard pLimit implementation since we don't have p-limit imported here
function pLimit(concurrency: number) {
  const queue: Function[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()!();
    }
  };

  return (fn: Function) => new Promise<any>((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      next();
    };

    if (activeCount < concurrency) {
      run();
    } else {
      queue.push(run);
    }
  });
}

function extractBeatmapId(url: string) {
  const match = url.match(/(?:#osu\/|beatmaps\/)(\d+)/);
  return match ? match[1] : null;
}

function parseOsuMods(modStr: string): string[] {
  const normalized = modStr.toUpperCase().replace(/[0-9]/g, '');
  const mods = [];
  if (normalized.includes('HD')) mods.push('HD');
  if (normalized.includes('HR')) mods.push('HR');
  if (normalized.includes('DT')) mods.push('DT');
  if (normalized.includes('NC')) mods.push('NC');
  if (normalized.includes('EZ')) mods.push('EZ');
  if (normalized.includes('FL')) mods.push('FL');
  if (normalized.includes('HT')) mods.push('HT');
  return mods;
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

    const data1 = Papa.parse(text1, { header: true, skipEmptyLines: true }).data.map((r: any) => ({ ...r, Tournament: 'Personal' }));
    const data2 = Papa.parse(text2, { header: true, skipEmptyLines: true }).data.map((r: any) => ({ ...r, Tournament: r['Tournament'] || 'Unknown' }));
    
    const combinedData = [...data1, ...data2];
    
    // 2. Map items and prepare osu! IDs
    const limit = pLimit(30); // 30 concurrent backend connections
    const mapDictionary: Record<string, any> = {};
    const validRows = [];

    // Filter valid rows and find missing ones
    for (const row of combinedData) {
      const modSlot = row['Mod'];
      const mapUrl = row['Map URL'];
      let beatmapId = null;
      if (mapUrl && typeof mapUrl === 'string') {
        beatmapId = extractBeatmapId(mapUrl);
      }
      
      if (!beatmapId || DELETED_MAP_IDS.includes(beatmapId)) continue;
      
      validRows.push({ row, beatmapId, modSlot });
    }

    // 3. Process all rows in parallel fetching osu! data
    const finalResult = [];
    
    const fetchPromises = validRows.map(({ row, beatmapId, modSlot }) => limit(async () => {
      // For backend we just fetch each map individually to keep attributes simple, but with extreme concurrency
      try {
        const mapRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!mapRes.ok) return null; // Map deleted or failed
        
        const mapData = await mapRes.json();
        const modArray = parseOsuMods(modSlot);
        
        // Fetch Mod specific Star Rating
        if (modArray.length > 0) {
          const attrRes = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/attributes`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mods: modArray.map(m => ({ acronym: m }))
            })
          });

          if (attrRes.ok) {
             const attrData = await attrRes.json();
             if (attrData.attributes?.star_rating) {
               mapData.difficulty_rating = attrData.attributes.star_rating;
             }
          }
        }

        const calculatedStats = calculateMods({
          cs: mapData.cs,
          ar: mapData.ar,
          accuracy: mapData.accuracy,
          drain: mapData.drain,
          bpm: mapData.bpm
        }, modSlot);

        return {
          ...mapData,
          calculatedStats,
          modSlot,
          tournament: row['Tournament']
        };
      } catch (err) {
        return null; // Skip on error
      }
    }));

    const resolvedMaps = await Promise.all(fetchPromises);
    const validMaps = resolvedMaps.filter(m => m !== null);

    // Cache the entire finished mappool array on Vercel Edge for 24 hours
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(validMaps);

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
