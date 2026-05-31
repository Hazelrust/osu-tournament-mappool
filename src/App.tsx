import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Loader2 } from 'lucide-react';
import MapCard from './components/MapCard';
import { calculateMods, extractBeatmapId } from './lib/osuUtils';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?output=csv';

function App() {
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappool = async () => {
      try {
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
                // Fetch from our local serverless function proxy
                const apiRes = await fetch(`/api/beatmap?id=${beatmapId}`);
                if (!apiRes.ok) continue;
                
                const mapData = await apiRes.json();
                
                // Calculate mods
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
      } catch (err) {
        console.error("Failed to fetch CSV", err);
        setLoading(false);
      }
    };

    fetchMappool();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
            osu! Practice Mappool Hub
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A beautiful, centralized hub for our custom tournament mappool practice.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-pink-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-xl font-semibold">Fetching and calculating beatmaps...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {maps.map((map) => (
              <MapCard key={`${map.modSlot}-${map.id}`} mapData={map} modSlot={map.modSlot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
