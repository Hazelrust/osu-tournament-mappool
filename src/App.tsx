import { useEffect, useState } from 'react';
import { Loader2, Search, Filter, Plus } from 'lucide-react';
import MapCard from './components/MapCard';
import ImporterModal from './components/ImporterModal';



function App() {
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModFilter, setActiveModFilter] = useState('ALL');
  const [activeMainTourney, setActiveMainTourney] = useState('ALL');
  const [activeSubTourney, setActiveSubTourney] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [activeModFilter, activeMainTourney, activeSubTourney, searchQuery]);

  useEffect(() => {
    const fetchMappool = async () => {
      try {

        const cacheKey = 'mappool_database';
        
        // Always try to load instantly from localStorage if it exists
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setMaps(JSON.parse(cached));
          setLoading(false);
        }

        // Fetch the fresh full database from the new backend
        const res = await fetch('/api/mappool');
        if (!res.ok) throw new Error('Failed to load mappool from server');
        
        const fullMappool = await res.json();
        
        // Save the new data and update the UI
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

  // Compute unique categories
  const modCategories = ['ALL', ...Array.from(new Set(maps.map(m => m.modSlot.replace(/[0-9]/g, ''))))].sort();
  
  // Group tournaments
  const getTourneyGroup = (name: string) => {
    if (!name) return 'Unknown';
    if (name === 'Personal') return 'Personal';
    const owcMatch = name.match(/OWC \d{4}/);
    if (owcMatch) return owcMatch[0];
    return name.split(' ')[0]; // Fallback for other things
  };

  const getTourneySub = (name: string, group: string) => {
    if (name === group) return name;
    return name.replace(group, '').trim();
  };

  const mainTourneys = ['ALL', ...Array.from(new Set(maps.map(m => getTourneyGroup(m.tournament))))].sort();
  
  const availableSubTourneys = ['ALL', ...Array.from(new Set(
    maps
      .filter(m => activeMainTourney === 'ALL' || getTourneyGroup(m.tournament) === activeMainTourney)
      .map(m => getTourneySub(m.tournament, getTourneyGroup(m.tournament)))
      .filter(sub => sub && sub.trim() !== '')
  ))];

  // Specific sorting for OWC rounds if present
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
    const matchesMod = activeModFilter === 'ALL' || map.modSlot.startsWith(activeModFilter);
    const group = getTourneyGroup(map.tournament);
    const sub = getTourneySub(map.tournament, group);
    
    const matchesMainTourney = activeMainTourney === 'ALL' || group === activeMainTourney;
    const matchesSubTourney = activeSubTourney === 'ALL' || sub === activeSubTourney;
    
    const matchesSearch = map.beatmapset?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          map.beatmapset?.artist?.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesMod && matchesMainTourney && matchesSubTourney && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-pink-500/30">
      <ImporterModal isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} />
      
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

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setIsImporterOpen(true)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-sm transition-colors shadow-[0_0_15px_rgba(236,72,153,0.3)] hidden sm:flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Import Pool
            </button>
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
            {/* Filters */}
            <div className="flex flex-col gap-6 mb-12 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
              
              {/* Main Tournament Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[120px]">
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
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
                      activeMainTourney === tourney 
                        ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
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
                  <div className="w-full h-px bg-white/5" />
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[120px]">
                      <span className="text-sm font-semibold uppercase tracking-wider pl-6">Stage</span>
                    </div>
                    {availableSubTourneys.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubTourney(sub)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-300 ${
                          activeSubTourney === sub 
                            ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="w-full h-px bg-white/5" />

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-2 text-slate-400 min-w-[120px]">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Mod Slot</span>
                </div>
                {modCategories.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setActiveModFilter(mod)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
                      activeModFilter === mod 
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredMaps.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p className="text-xl">No maps found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                  {filteredMaps.slice(0, visibleCount).map((map, idx) => (
                    <MapCard key={`${map.modSlot}-${map.id}-${idx}`} mapData={map} modSlot={map.modSlot} />
                  ))}
                </div>
                
                {visibleCount < filteredMaps.length && (
                  <div className="flex justify-center mt-12">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)]"
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
    </div>
  );
}

export default App;
