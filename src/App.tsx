import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Loader2, Search, Filter } from 'lucide-react';
import MapCard from './components/MapCard';
import { calculateMods, extractBeatmapId } from './lib/osuUtils';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?output=csv';

let cachedToken = '';
let tokenExpiresAt = 0;

async function getOsuToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  
  const res = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: import.meta.env.VITE_OSU_CLIENT_ID,
      client_secret: import.meta.env.VITE_OSU_CLIENT_SECRET,
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

function App() {
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMappool = async () => {
      try {
        const token = await getOsuToken();
        const response = await fetch(CSV_URL);
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          complete: async (results) => {
            const parsedMaps = [];
            for (const row of results.data as any[]) {
              const modSlot = row['Mod'];
              const mapUrl = row['Map URL'];
              
              if (!modSlot || !mapUrl) continue;

              const beatmapId = extractBeatmapId(mapUrl);
              if (!beatmapId) continue;

              try {
                const apiRes = await fetch(`/api/v2/beatmaps/${beatmapId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!apiRes.ok) continue;
                
                const mapData = await apiRes.json();
                
                const modArray = parseOsuMods(modSlot);
                
                // Fetch the actual difficulty attributes with the mods applied for accurate Star Rating
                const attrRes = await fetch(`/api/v2/beatmaps/${beatmapId}/attributes`, {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    mods: modArray,
                    ruleset: 'osu'
                  })
                });

                if (attrRes.ok) {
                   const attrData = await attrRes.json();
                   if (attrData.attributes?.star_rating) {
                     mapData.difficulty_rating = attrData.attributes.star_rating;
                   }
                }
                
                const calculatedStats = calculateMods({
                  cs: mapData.cs,
                  ar: mapData.ar,
                  accuracy: mapData.accuracy,
                  drain: mapData.drain,
                  bpm: mapData.bpm
                }, modSlot);

                parsedMaps.push({
                  ...mapData,
                  calculatedStats,
                  modSlot
                });
              } catch (err) {
                console.error("Failed to fetch map", beatmapId, err);
              }
            }
            setMaps(parsedMaps);
            setLoading(false);
          }
        });
      } catch (err: any) {
        console.error("Failed to fetch data", err);
        setError(err.message || "Failed to load maps");
        setLoading(false);
      }
    };

    fetchMappool();
  }, []);

  // Compute unique mod categories (NM, HD, HR, DT, FM, TB, etc)
  const modCategories = ['ALL', ...Array.from(new Set(maps.map(m => m.modSlot.replace(/[0-9]/g, ''))))];

  const filteredMaps = maps.filter(map => {
    const matchesFilter = activeFilter === 'ALL' || map.modSlot.startsWith(activeFilter);
    const matchesSearch = map.beatmapset?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          map.beatmapset?.artist?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-pink-500/30">
      
      {/* Abstract Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Glassmorphism Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              O!
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Practice Hub</h1>
          </div>

          <div className="relative w-full max-w-md ml-4 sm:ml-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by title or artist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-white/5 text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all sm:text-sm"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* Hero Title */}
        <div className="text-center mb-16 mt-8">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Master your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              Tournament Pool
            </span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Live integration with Google Sheets. Beautiful beatmap cards. Perfect math. Let's start clicking circles.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-12 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-pink-500/30 animate-pulse" />
              <Loader2 className="relative w-16 h-16 animate-spin text-pink-500" />
            </div>
            <p className="mt-6 text-lg font-medium text-slate-300 animate-pulse">Syncing with Google Sheets...</p>
          </div>
        ) : (
          <>
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <div className="flex items-center gap-2 mr-2 text-slate-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wider">Filter Mods</span>
              </div>
              {modCategories.map((mod) => (
                <button
                  key={mod}
                  onClick={() => setActiveFilter(mod)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeFilter === mod 
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredMaps.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p className="text-xl">No maps found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {filteredMaps.map((map) => (
                  <MapCard key={`${map.modSlot}-${map.id}`} mapData={map} modSlot={map.modSlot} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
