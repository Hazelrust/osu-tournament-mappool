

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
  if (mod.startsWith('NM')) return 'bg-sky-500 text-white';
  if (mod.startsWith('HR')) return 'bg-red-600 text-white';
  if (mod.startsWith('HD')) return 'bg-yellow-400 text-slate-900';
  if (mod.startsWith('DT')) return 'bg-purple-500 text-white';
  if (mod.startsWith('EZ')) return 'bg-green-500 text-white';
  if (mod.startsWith('FM')) return 'bg-orange-500 text-white';
  if (mod.startsWith('TB')) return 'bg-[#1a1a24] text-white border border-slate-600 shadow-md';
  return 'bg-slate-600 text-white';
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
    <div className="group relative bg-[#1c1c24] rounded-lg overflow-hidden border border-white/5 hover:border-[#ff66aa]/50 transition-all duration-200">
      
      {/* Background Image Wrapper */}
      {mapData.beatmapset?.covers?.cover && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-200"
          style={{ backgroundImage: `url(${mapData.beatmapset.covers.cover})` }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-[#111115]/80 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 p-3 sm:p-4 h-full flex flex-col">
        
        {/* Top Header: Mod & Difficulty */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex flex-col gap-1 items-start">
            <span className={`font-black text-lg sm:text-xl px-2 sm:px-3 py-0.5 rounded-sm tracking-tight ${getModColor(modSlot)}`}>
              {modSlot}
            </span>
            {archetype && (
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300 bg-black/60 px-2 py-0.5 rounded-sm">
                {archetype}
              </span>
            )}
            {tourneyGroup && (
              <div className="flex gap-1 mt-0.5">
                <span className={`text-[10px] sm:text-[11px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                  tourneyGroup === 'Personal' 
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-orange-900 text-orange-200'
                }`}>
                  {tourneyGroup}
                </span>
                {tourneyStage && (
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-slate-200">
                    {tourneyStage}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded-sm border border-yellow-500/30">
              <span className="font-black text-yellow-400 text-sm sm:text-base">
                {Number(mapData.difficulty_rating).toFixed(2)}
              </span>
              <span className="text-yellow-400 text-xs">★</span>
            </div>
          </div>
        </div>
        
        {/* Middle: Map Info */}
        <div className="mt-auto pt-4 sm:pt-6 flex flex-col gap-1 relative z-40 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-1 group-hover:text-[#ff66aa] transition-colors">
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
                className={`shrink-0 p-1.5 rounded-full transition-all duration-200 ${
                  playingMapId === mapData.id 
                    ? 'bg-[#ff66aa] text-white'
                    : 'bg-black/60 text-slate-300 hover:bg-[#ff66aa] hover:text-white'
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
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-1">
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
        <div className="grid grid-cols-5 gap-1 text-[10px] sm:text-[11px] font-mono font-bold mt-1 sm:mt-2">
          <div className="flex flex-col items-center justify-center bg-black/60 py-1 rounded-sm">
            <span className="text-slate-500 text-[8px] sm:text-[9px] mb-0.5">CS</span>
            <span className="text-white">{mapData.calculatedStats?.cs}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/60 py-1 rounded-sm">
            <span className="text-slate-500 text-[8px] sm:text-[9px] mb-0.5">AR</span>
            <span className="text-white">{mapData.calculatedStats?.ar}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/60 py-1 rounded-sm">
            <span className="text-slate-500 text-[8px] sm:text-[9px] mb-0.5">OD</span>
            <span className="text-white">{mapData.calculatedStats?.od}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/60 py-1 rounded-sm">
            <span className="text-pink-500/70 text-[8px] sm:text-[9px] mb-0.5">BPM</span>
            <span className="text-pink-200">{mapData.calculatedStats?.bpm}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-black/60 py-1 rounded-sm">
            <span className="text-sky-500/70 text-[8px] sm:text-[9px] mb-0.5">LEN</span>
            <span className="text-sky-200">
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
