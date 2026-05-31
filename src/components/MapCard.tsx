

export interface MapData {
  beatmapset?: {
    covers?: {
      cover?: string;
    };
    title?: string;
    artist?: string;
    creator?: string;
  };
  difficulty_rating?: number;
  version?: string;
  calculatedStats?: {
    cs?: number | string;
    ar?: number | string;
    od?: number | string;
    hp?: number | string;
    bpm?: number | string;
  };
  url?: string;
}

export default function MapCard({ mapData, modSlot }: { mapData: MapData, modSlot: string }) {
  if (!mapData) return null;
  const bgUrl = mapData.beatmapset?.covers?.cover || '';
  
  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-slate-900 group transition-transform hover:-translate-y-1">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="relative p-4 flex flex-col h-full bg-gradient-to-t from-slate-950/90 to-transparent">
        <div className="flex justify-between items-start mb-12">
          <span className="font-bold text-xl px-3 py-1 bg-pink-600/90 rounded-md text-white shadow-sm">
            {modSlot}
          </span>
          <span className="font-semibold text-yellow-400 bg-black/50 px-2 rounded">
            {Number(mapData.difficulty_rating).toFixed(2)}★
          </span>
        </div>
        
        <div className="mt-auto">
          <h3 className="text-xl font-bold text-white leading-tight truncate">{mapData.beatmapset?.title}</h3>
          <p className="text-sm text-slate-300 mb-2 truncate">{mapData.beatmapset?.artist}</p>
          
          <div className="flex justify-between text-xs text-slate-400 mb-3 border-b border-slate-700/50 pb-2">
            <span className="truncate flex-1">[{mapData.version}] mapped by {mapData.beatmapset?.creator}</span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono font-semibold text-white">
            <div className="bg-slate-800/80 rounded py-1">CS <br/><span className="text-blue-300">{mapData.calculatedStats?.cs}</span></div>
            <div className="bg-slate-800/80 rounded py-1">AR <br/><span className="text-red-300">{mapData.calculatedStats?.ar}</span></div>
            <div className="bg-slate-800/80 rounded py-1">OD <br/><span className="text-green-300">{mapData.calculatedStats?.od}</span></div>
            <div className="bg-slate-800/80 rounded py-1">HP <br/><span className="text-yellow-300">{mapData.calculatedStats?.hp}</span></div>
            <div className="bg-slate-800/80 rounded py-1">BPM <br/><span className="text-purple-300">{mapData.calculatedStats?.bpm}</span></div>
          </div>
        </div>
        <a href={mapData.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label="View on osu! website" />
      </div>
    </div>
  );
}
