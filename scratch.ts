import Papa from 'papaparse';

async function run() {
  const res2 = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS7LaX7C-9lrfPPwiX1NXnkhHHXMNQ1SWwn0SyXBIc76gupYUTPrjAe4yPsPjvKpUAhsuqgTvpSU53l/pub?gid=1413426737&single=true&output=csv');
  const text2 = await res2.text();
  
  const parsed2 = Papa.parse(text2, { header: false, skipEmptyLines: true }).data as string[][];
  const data2 = parsed2.map(row => ({
    Tournament: row[0] || 'Unknown',
    Mod: row[1] || '',
    'Map URL': row[2] || ''
  }));
  
  console.log("Total rows in Sheet 2:", data2.length);
  
  let valid = 0;
  for (const row of data2) {
    const mapUrl = row['Map URL'];
    let beatmapId = null;
    if (mapUrl && typeof mapUrl === 'string') {
      const match = mapUrl.match(/(?:#osu\/|beatmaps\/|b\/)(\d+)/);
      beatmapId = match ? match[1] : null;
    }
    if (beatmapId) valid++;
  }
  
  console.log("Valid Beatmap IDs extracted:", valid);
}

run().catch(console.error);
