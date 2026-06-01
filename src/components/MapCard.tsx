

import { Play, Pause } from 'lucide-react';

export interface MapData {
  id?: string;
  url?: string;
  version?: string;
  difficulty_rating?: number;
  total_length?: number;
  beatmapset_id?: number;
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

interface MapCardProps {
  mapData: MapData;
  modSlot: string;
  playingMapId?: string | null;
  onTogglePreview?: (mapId: string, previewUrl: string) => void;
}

export default function MapCard({ mapData, modSlot, playingMapId, onTogglePreview }: MapCardProps) {
  if (!mapData) return null;
  const safeModSlot = modSlot || '';
  const archetype = ARCHETYPE_MAP[safeModSlot.toUpperCase().trim()];

  const tourneyName = mapData.tournament || 'Unknown';
  
  const getTourneyGroup = (name: string) => {
    if (!name) return 'Unknown';
    if (name === 'Personal') return 'Personal';
    const owcMatch = name.match(/OWC \d{4}/);
    if (owcMatch) return owcMatch[0];
    return name.split(' ')[0];
  };

  const getTourneySub = (name: string, group: string) => {
    if (name === group) return '';
    return (name || '').replace(group, '').trim();
  };
  
  const tourneyGroup = getTourneyGroup(tourneyName);
  const tourneyStage = getTourneySub(tourneyName, tourneyGroup);

  return (
    <div className="group relative bg-[#111115] rounded-xl overflow-hidden border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#ff66aa]/50 hover:shadow-[0_4px_30px_rgba(255,102,170,0.2)] transition-all duration-300">
      
      {/* Background Image Wrapper */}
      {mapData.beatmapset?.covers?.cover && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
          style={{ backgroundImage: `url(${mapData.beatmapset.covers.cover})` }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-[#111115]/60 to-[#111115]/30 z-10" />

      {/* Content */}
      <div className="relative z-20 p-3 sm:p-4 h-full flex flex-col">
        
        {/* Top Header: Mod & Difficulty */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex flex-col gap-1.5 items-start">
            <span className={`font-black text-lg sm:text-xl px-2 sm:px-3 py-0.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] tracking-tight ${getModColor(modSlot)}`}>
              {modSlot}
            </span>
            {archetype && (
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-200 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-sm">
                {archetype}
              </span>
            )}
            {tourneyGroup && (
              <div className="flex gap-1.5 mt-0.5">
                <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm backdrop-blur-md ${
                  tourneyGroup === 'Personal' 
                    ? 'bg-blue-900/60 text-blue-200 border border-blue-500/30'
                    : 'bg-orange-900/60 text-orange-200 border border-orange-500/30'
                }`}>
                  {tourneyGroup}
                </span>
                {tourneyStage && (
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm backdrop-blur-md bg-white/10 text-slate-200 border border-white/20">
                    {tourneyStage}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 backdrop-blur-md px-2 sm:px-3 py-1 rounded-lg border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 text-base sm:text-lg">
                {Number(mapData.difficulty_rating).toFixed(2)}
              </span>
              <span className="text-yellow-400 text-xs sm:text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">★</span>
            </div>
          </div>
        </div>
        
        {/* Middle: Map Info */}
        <div className="mt-auto pt-4 sm:pt-6 flex flex-col gap-1 relative z-40 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-indigo-400 transition-all drop-shadow-md">
              {mapData.beatmapset?.title}
            </h3>
            {mapData.beatmapset_id && onTogglePreview && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePreview(mapData.id || '', `https://b.ppy.sh/preview/${mapData.beatmapset_id}.mp3`);
                }}
                title="Preview Song"
                className={`shrink-0 p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
                  playingMapId === mapData.id 
                    ? 'bg-[#ff66aa] border-[#ff66aa] shadow-[0_0_15px_rgba(255,102,170,0.6)] text-white scale-110'
                    : 'bg-black/40 border-white/10 hover:bg-[#ff66aa]/80 hover:border-[#ff66aa] hover:shadow-[0_0_10px_rgba(255,102,170,0.4)] text-slate-300 hover:text-white'
                }`}
              >
                {playingMapId === mapData.id ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-pink-300/90 line-clamp-1 drop-shadow-md tracking-wide">
            {mapData.beatmapset?.artist}
          </p>
          
          <div className="flex items-center gap-2 mt-1 sm:mt-2 mb-3 sm:mb-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium bg-black/40 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/5 backdrop-blur-md whitespace-nowrap max-w-[120px] sm:max-w-[150px] truncate">
              <span className="text-slate-200 font-bold">{mapData.version}</span> by {mapData.beatmapset?.creator}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
        </div>

        {/* Bottom: Stats Pills */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold mt-1 sm:mt-2">
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5">CS</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.cs}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5">AR</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.ar}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-slate-500 text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5">OD</span>
            <span className="text-white drop-shadow-md">{mapData.calculatedStats?.od}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-pink-500/70 text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5">BPM</span>
            <span className="text-pink-100 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">{mapData.calculatedStats?.bpm}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
            <span className="text-blue-500/70 text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5">LEN</span>
            <span className="text-blue-100 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
              {Math.floor((mapData.total_length || 0) / 60)}:{String((mapData.total_length || 0) % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* --- PERFORMANCE TRACKER MOCKUP --- */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10 relative z-40 pointer-events-auto flex flex-col gap-2">
          
          {/* Header & Confidence Tag */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">Your Performance</span>
            
            {/* Mock Confidence Toggle (Needs Work -> Practicing -> Ready) */}
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300">Ready</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div 
            className="flex items-center justify-between bg-black/50 backdrop-blur-md rounded-lg p-2 border border-white/5 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group/stats"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="Click to edit your score"
          >
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
              <span className="text-sm font-black text-white group-hover/stats:text-blue-300 transition-colors">945,210</span>
            </div>
            
            <div className="w-px h-6 bg-white/10" />
            
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Acc</span>
              <span className="text-sm font-black text-white">98.45%</span>
            </div>
            
            <div className="w-px h-6 bg-white/10" />
            
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Miss</span>
              <span className="text-sm font-black text-red-400">2x</span>
            </div>
          </div>
          
        </div>
        {/* --- END PERFORMANCE TRACKER MOCKUP --- */}
        
        {/* Invisible Click Target */}
        <a href={mapData.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-30 cursor-pointer" aria-label={`View ${mapData.beatmapset?.title} on osu!`} />
      </div>
    </div>
  );
}
