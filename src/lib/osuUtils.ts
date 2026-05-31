export interface BaseStats {
  cs: number;
  ar: number;
  accuracy: number;
  drain: number;
  bpm: number;
}

export function calculateMods(baseStats: BaseStats, modStr: string) {
  const mod = modStr.toUpperCase().replace(/[0-9]/g, ''); // NM1 -> NM
  let { cs, ar, accuracy: od, drain: hp, bpm } = baseStats;
  
  if (mod.includes('HR')) {
    cs = Math.min(10, cs * 1.3);
    ar = Math.min(10, ar * 1.4);
    od = Math.min(10, od * 1.4);
    hp = Math.min(10, hp * 1.4);
  } else if (mod.includes('DT')) {
    bpm = bpm * 1.5;
    // DT formula approximation for AR and OD
    const msAr = ar > 5 ? 1200 - 150 * (ar - 5) : 1200 + 120 * (5 - ar);
    const dtMsAr = msAr / 1.5;
    ar = dtMsAr < 1200 ? 5 + (1200 - dtMsAr) / 150 : 5 - (dtMsAr - 1200) / 120;
    const msOd = 80 - 6 * od;
    const dtMsOd = msOd / 1.5;
    od = (80 - dtMsOd) / 6;
  } else if (mod.includes('EZ')) {
    cs = cs / 2;
    ar = ar / 2;
    od = od / 2;
    hp = hp / 2;
  }
  
  return { cs: Number(cs.toFixed(1)), ar: Number(ar.toFixed(1)), od: Number(od.toFixed(1)), hp: Number(hp.toFixed(1)), bpm: Math.round(bpm) };
}

export function extractBeatmapId(url: string) {
  // Matches ...#osu/12345, /beatmaps/12345, or /b/12345
  const match = url.match(/(?:#osu\/|beatmaps\/|b\/)(\d+)/);
  return match ? match[1] : null;
}
