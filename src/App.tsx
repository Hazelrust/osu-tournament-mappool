import { useEffect, useState, useRef } from 'react';
import { Loader2, Search, Filter, Star, Activity, Clock, ListOrdered, ArrowDownUp } from 'lucide-react';
import MapCard from './components/MapCard';
function App() {
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModFilter, setActiveModFilter] = useState('ALL');
  const [activeMainTourney, setActiveMainTourney] = useState('ALL');
  const [activeSubTourney, setActiveSubTourney] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Default'); // Default, Stars, BPM, Length
  const [sortDesc, setSortDesc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);
  const [playingMapId, setPlayingMapId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (mapId: string, previewUrl: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
      audioRef.current.onended = () => setPlayingMapId(null);
    }
    
    if (playingMapId === mapId) {
      audioRef.current.pause();
      setPlayingMapId(null);
    } else {
      audioRef.current.src = previewUrl;
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
      setPlayingMapId(mapId);
    }
  };
  
  // Reset pagination when filters or sort change
  useEffect(() => {
    setVisibleCount(50);
  }, [activeModFilter, activeMainTourney, activeSubTourney, searchQuery, sortBy, sortDesc]);

  useEffect(() => {
    const fetchMappool = async () => {
      try {
        const cacheKey = 'mappool_database';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setMaps(JSON.parse(cached));
          setLoading(false);
        }
        const res = await fetch('/api/mappool');
        if (!res.ok) throw new Error('Failed to load mappool from server');
        const fullMappool = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify(fullMappool));
        setMaps(fullMappool);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch data", err);
        setError(err.message || "Failed to load maps");
        setLoading(false);
      }
    };
    fetchMappool();
  }, []);

  const modCategories = ['ALL', ...Array.from(new Set(maps.map(m => (m.modSlot || '').replace(/[0-9]/g, ''))))].filter(Boolean).sort();
  
  const getTourneyGroup = (name: string) => {
    if (!name) return 'Unknown';
    if (name === 'Personal') return 'Personal';
    const owcMatch = name.match(/OWC \d{4}/);
    if (owcMatch) return owcMatch[0];
    return name.split(' ')[0];
  };

  const getTourneySub = (name: string, group: string) => {
    if (name === group) return name;
    return (name || '').replace(group, '').trim();
  };

  const mainTourneys = ['ALL', ...Array.from(new Set(maps.map(m => getTourneyGroup(m.tournament))))].sort();
  
  const availableSubTourneys = ['ALL', ...Array.from(new Set(
    maps
      .filter(m => activeMainTourney === 'ALL' || getTourneyGroup(m.tournament) === activeMainTourney)
      .map(m => getTourneySub(m.tournament, getTourneyGroup(m.tournament)))
      .filter(sub => sub && sub.trim() !== '')
  ))];

  const owcOrder = ["Qualifiers", "Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Finals", "Grand Finals"];
  
  availableSubTourneys.sort((a, b) => {
    if (a === 'ALL') return -1;
    if (b === 'ALL') return 1;
    const idxA = owcOrder.indexOf(a);
    const idxB = owcOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  const filteredMaps = maps.filter(map => {
    const matchesMod = activeModFilter === 'ALL' || (map.modSlot || '').startsWith(activeModFilter);
    const group = getTourneyGroup(map.tournament);
    const sub = getTourneySub(map.tournament, group);
    const matchesMainTourney = activeMainTourney === 'ALL' || group === activeMainTourney;
    const matchesSubTourney = activeSubTourney === 'ALL' || sub === activeSubTourney;
    const matchesSearch = map.beatmapset?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          map.beatmapset?.artist?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMod && matchesMainTourney && matchesSubTourney && matchesSearch;
  });

  // Apply sorting
  filteredMaps.sort((a, b) => {
    const modifier = sortDesc ? 1 : -1;
    
    if (sortBy === 'Stars') {
      return ((b.difficulty_rating || 0) - (a.difficulty_rating || 0)) * modifier;
    }
    if (sortBy === 'BPM') {
      return ((b.calculatedStats?.bpm || 0) - (a.calculatedStats?.bpm || 0)) * modifier;
    }
    if (sortBy === 'Length') {
      return ((b.total_length || 0) - (a.total_length || 0)) * modifier;
    }
    
    // Default Sorting (Tournament Stage Order -> Mod Slot)
    const subA = getTourneySub(a.tournament, getTourneyGroup(a.tournament));
    const subB = getTourneySub(b.tournament, getTourneyGroup(b.tournament));
    const idxA = owcOrder.indexOf(subA);
    const idxB = owcOrder.indexOf(subB);
    
    let result = 0;
    if (idxA !== -1 && idxB !== -1 && idxA !== idxB) result = idxA - idxB;
    else if (idxA !== -1 && idxB === -1) result = -1;
    else if (idxA === -1 && idxB !== -1) result = 1;
    else result = (a.modSlot || '').localeCompare(b.modSlot || '');
    
    return result * modifier;
  });

  return (
    <div className="min-h-screen bg-[#111115] text-white font-sans selection:bg-pink-500/30 overflow-x-hidden">
      {/* Authentic osu! style background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        
        {/* Large faint circles in background mimicking osu! circles */}
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full border border-white/5 opacity-20 transform -rotate-12" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full border-[20px] border-pink-500/5 opacity-20" />
      </div>

      {/* Sleek Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#111115]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#ff66aa] border-2 border-white/20 flex items-center justify-center font-black text-lg sm:text-xl shadow-[0_0_15px_rgba(255,102,170,0.3)] text-white">
              O!
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden md:block text-slate-100">Practice Hub</h1>
          </div>

          <div className="flex items-center w-full max-w-xs sm:max-w-md ml-4 sm:ml-0">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search maps..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-[#1a1a20] text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-24">
        
        {/* Hero Title */}
        <div className="text-center mb-8 sm:mb-16 mt-2 sm:mt-8 px-2">
          <h2 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-3 sm:mb-6 leading-tight">
            Master your <br className="sm:hidden" />
            <span className="text-[#ff66aa]">
              Tournament Pool
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto font-medium px-4">
            The ultimate training ground for your roster. Analyze the pool, identify your picks, and grind the hardest mechanics before match day.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-12 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-[#ff66aa]" />
            <p className="mt-6 text-lg font-medium text-slate-400">Loading maps...</p>
          </div>
        ) : (
          <>
            {/* Filters & Sorting */}
            <div className="flex flex-col gap-6 mb-10 sm:mb-12 bg-[#1a1a20] p-4 sm:p-6 rounded-2xl border border-white/5 shadow-xl">
              
              <div className="flex flex-col gap-6 w-full overflow-hidden">
                {/* Main Tournament Filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                  <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[100px] shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Tournament</span>
                  </div>
                  {mainTourneys.map((tourney) => (
                    <button
                      key={tourney}
                      onClick={() => {
                        setActiveMainTourney(tourney);
                        setActiveSubTourney('ALL'); // Reset sub filter
                      }}
                      className={`shrink-0 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                        activeMainTourney === tourney 
                          ? 'bg-[#ff66aa] text-white shadow-[0_0_15px_rgba(255,102,170,0.4)]'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tourney}
                    </button>
                  ))}
                </div>

                {/* Sub Tournament Filter (Only show if there are sub options besides ALL) */}
                {availableSubTourneys.length > 1 && (
                  <>
                    <div className="w-full h-px bg-white/5 hidden sm:block" />
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                      <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[100px] shrink-0">
                        <span className="text-sm font-semibold uppercase tracking-wider sm:pl-6">Stage</span>
                      </div>
                      {availableSubTourneys.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setActiveSubTourney(sub)}
                          className={`shrink-0 px-3 py-1.5 sm:py-1 rounded-md text-sm sm:text-xs font-bold transition-all duration-200 ${
                            activeSubTourney === sub 
                              ? 'bg-white/20 text-white shadow-sm'
                              : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="w-full h-px bg-white/5" />

                {/* Mod Slot Filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                  <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[100px] shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Mod Slot</span>
                  </div>
                  {modCategories.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => setActiveModFilter(mod)}
                      className={`shrink-0 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                        activeModFilter === mod 
                          ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* Fancy Sort Toggle (Volume-like buttons) */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full">
                  <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[100px] shrink-0">
                    <ArrowDownUp className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Sort By</span>
                  </div>
                  <div className="flex bg-[#111115] p-1.5 rounded-xl border border-white/10 shadow-inner w-full sm:w-auto">
                    {[
                      { id: 'Default', label: 'Stage', icon: ListOrdered, activeColor: 'bg-white/20 text-white shadow-sm' },
                      { id: 'Stars', label: 'Stars', icon: Star, activeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
                      { id: 'BPM', label: 'BPM', icon: Activity, activeColor: 'bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]' },
                      { id: 'Length', label: 'Length', icon: Clock, activeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' }
                    ].map(s => {
                      const Icon = s.icon;
                      const isActive = sortBy === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (isActive) setSortDesc(!sortDesc);
                            else { setSortBy(s.id); setSortDesc(true); }
                          }}
                          className={`relative flex items-center justify-center gap-1.5 px-2 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
                            isActive ? s.activeColor : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5 mr-1">
                            {/* Volume-bar style Asc/Desc indicator */}
                            <div className={`w-2 h-1 rounded-sm ${isActive && !sortDesc ? 'bg-current' : 'bg-current opacity-30'}`} />
                            <div className={`w-3 h-1 rounded-sm ${isActive && sortDesc ? 'bg-current' : 'bg-current opacity-30'}`} />
                          </div>
                          <Icon className={`w-4 h-4 hidden sm:block ${isActive ? '' : 'opacity-70'}`} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid */}
            {filteredMaps.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-xl font-medium">No maps found matching your criteria.</p>
                <button onClick={() => { setSearchQuery(''); setActiveModFilter('ALL'); setActiveMainTourney('ALL'); setActiveSubTourney('ALL'); }} className="mt-4 text-pink-400 hover:text-pink-300 underline">Reset Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
                  {filteredMaps.slice(0, visibleCount).map((map, idx) => (
                    <MapCard 
                      key={`${map.modSlot}-${map.id}-${idx}`} 
                      mapData={map} 
                      modSlot={map.modSlot} 
                      playingMapId={playingMapId}
                      onTogglePreview={togglePreview}
                    />
                  ))}
                </div>
                
                {visibleCount < filteredMaps.length && (
                  <div className="flex justify-center mt-10 sm:mt-12">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="w-full sm:w-auto px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] active:scale-95"
                    >
                      Load More Maps ({filteredMaps.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050508]/80 backdrop-blur-md py-8 text-center">
        <p className="text-slate-500 text-sm font-medium">
          osu! Practice Mappool Hub &copy; {new Date().getFullYear()} by <span className="text-pink-400 font-bold hover:text-pink-300 cursor-default transition-colors">Hazelrust</span>. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
