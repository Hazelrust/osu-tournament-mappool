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
            <span className={`font-black text-xl px-3 py-0.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] tracking-tight ${getModColor(modSlot)}`}>
              {modSlot}
            </span>
            {archetype && (
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-200 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-sm">
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
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 backdrop-blur-md px-3 py-1 rounded-lg border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 text-lg">
                {Number(mapData.difficulty_rating).toFixed(2)}
              </span>
              <span className="text-yellow-400 text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">★</span>
            </div>
          </div>
        </div>
        
        {/* Middle: Map Info */}
        <div className="mt-auto pt-6 flex flex-col gap-1">
          <h3 className="text-2xl font-black text-white leading-tight line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-indigo-400 transition-all drop-shadow-md">
            {mapData.beatmapset?.title}
          </h3>
          <p className="text-sm font-semibold text-pink-300/90 line-clamp-1 drop-shadow-md tracking-wide">
            {mapData.beatmapset?.artist}
          </p>
          
          <div className="flex items-center gap-2 mt-2 mb-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[11px] text-slate-400 font-medium bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5 backdrop-blur-md whitespace-nowrap max-w-[150px] truncate">
              <span className="text-slate-200 font-bold">{mapData.version}</span> by {mapData.beatmapset?.creator}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
        </div>

        {/* Bottom: Stats Pills */}
        <div className="grid grid-cols-5 gap-1.5 text-[11px] font-mono font-bold mt-2">
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">CS</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.cs}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">AR</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.ar}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">OD</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.od}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-pink-500/70 text-[9px] uppercase tracking-widest mb-0.5">BPM</span>
            <span className="text-pink-100 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">{mapData.calculatedStats?.bpm}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-blue-500/70 text-[9px] uppercase tracking-widest mb-0.5">LEN</span>
            <span className="text-blue-100 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
              {Math.floor((mapData.total_length || 0) / 60)}:{String((mapData.total_length || 0) % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
        
        {/* Invisible Click Target */}
        <a href={mapData.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-30 cursor-pointer" aria-label={`View ${mapData.beatmapset?.title} on osu!`} />
      </div>
    </div>
  );
}
