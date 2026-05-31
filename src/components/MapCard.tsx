import { ExternalLink } from 'lucide-react';

export interface MapData {
  id?: string;
  url?: string;
  version?: string;
  difficulty_rating?: number;
  beatmapset?: {
    title?: string;
    artist?: string;
    creator?: string;
    covers?: {
      cover?: string;
    }
  };
  calculatedStats?: {
    cs?: number;
    ar?: number;
    od?: number;
    hp?: number;
    bpm?: number;
  };
  tournament?: string;
}

const ARCHETYPE_MAP: Record<string, string> = {
  NM1: "Aim Consistency",
  NM2: "Streams",
  NM3: "Alternating",
  NM4: "Tech",
  NM5: "Speed",
  NM6: "Miscellaneous",
  HD1: "Reading Consistency",
  HD2: "Low AR Reading",
  HD3: "Miscellaneous",
  HR1: "Aim Consistency",
  HR2: "Precision Aim",
  HR3: "Miscellaneous",
  DT1: "Aim Consistency",
  DT2: "Stamina Speed",
  DT3: "Fast Speed",
  DT4: "Miscellaneous",
  FM1: "Aim Focused",
  FM2: "Antimod",
  FM3: "Miscellaneous",
  TB: "Balanced Marathon",
  TB1: "Balanced Marathon"
};

function getModColor(modSlot: string) {
  const mod = (modSlot || '').toUpperCase();
  if (mod.startsWith('NM')) return 'bg-sky-500/90 text-white';
  if (mod.startsWith('HR')) return 'bg-red-600/90 text-white';
  if (mod.startsWith('HD')) return 'bg-yellow-500/90 text-slate-900';
  if (mod.startsWith('DT')) return 'bg-purple-600/90 text-white';
  if (mod.startsWith('EZ')) return 'bg-green-600/90 text-white';
  if (mod.startsWith('FM')) return 'bg-orange-500/90 text-white';
  if (mod.startsWith('TB')) return 'bg-black text-white border border-slate-700 shadow-[0_0_10px_rgba(0,0,0,0.5)]';
  return 'bg-slate-600/90 text-white';
}

export default function MapCard({ mapData, modSlot }: { mapData: MapData, modSlot: string }) {
  if (!mapData) return null;
  const bgUrl = mapData.beatmapset?.covers?.cover || '';
  const safeModSlot = modSlot || '';
  const archetype = ARCHETYPE_MAP[safeModSlot.toUpperCase().trim()];

  
  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-700/50 bg-slate-900 group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-slate-500/50 flex flex-col h-full">
      {/* Background Image with animated overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      
      {/* Hover Affordance (External Link Icon) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
        <div className="bg-black/60 p-4 rounded-full backdrop-blur-md transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <ExternalLink className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="relative p-5 flex flex-col h-full z-10">
        
        {/* Top Header: Mod & Difficulty */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1.5 items-start">
            <span className={`font-black text-xl px-3 py-0.5 rounded shadow-sm tracking-tight ${getModColor(modSlot)}`}>
              {modSlot}
            </span>
            {archetype && (
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300 bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-sm">
                {archetype}
              </span>
            )}
            {mapData.tournament && (
              <span className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md ${
                mapData.tournament === 'Personal' 
                  ? 'bg-blue-900/60 text-blue-200 border border-blue-500/30'
                  : 'bg-orange-900/60 text-orange-200 border border-orange-500/30'
              }`}>
                {mapData.tournament}
              </span>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-bold text-yellow-400 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded border border-yellow-500/20 shadow-sm flex items-center gap-1">
              {Number(mapData.difficulty_rating).toFixed(2)}<span className="text-sm">★</span>
            </span>
          </div>
        </div>
        
        {/* Middle: Map Info */}
        <div className="mt-auto pt-4 flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-1 group-hover:text-pink-300 transition-colors">
            {mapData.beatmapset?.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-1 font-medium">
            {mapData.beatmapset?.artist}
          </p>
          
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 mb-3">
            <span className="truncate flex-1 font-medium bg-white/5 px-2 py-0.5 rounded-full w-fit max-w-[80%] border border-white/5">
              <span className="text-slate-300">{mapData.version}</span> by {mapData.beatmapset?.creator}
            </span>
          </div>
        </div>

        {/* Bottom: Stats Pills */}
        <div className="flex gap-1.5 text-[11px] font-mono font-semibold text-slate-300 mt-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
            <span className="text-slate-500">CS</span><span className="text-white">{mapData.calculatedStats?.cs}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
            <span className="text-slate-500">AR</span><span className="text-white">{mapData.calculatedStats?.ar}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
            <span className="text-slate-500">OD</span><span className="text-white">{mapData.calculatedStats?.od}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50 ml-auto">
            <span className="text-slate-500">BPM</span><span className="text-pink-300">{mapData.calculatedStats?.bpm}</span>
          </div>
        </div>
        
        {/* Invisible Click Target */}
        <a href={mapData.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-30 cursor-pointer" aria-label={`View ${mapData.beatmapset?.title} on osu!`} />
      </div>
    </div>
  );
}
