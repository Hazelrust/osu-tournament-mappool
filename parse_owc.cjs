const fs = require('fs');
const { execSync } = require('child_process');

const contentPath = 'C:\\Users\\User\\.gemini\\antigravity-cli\\brain\\62408da1-f0fb-4058-a18d-6aadfb2a3909\\.system_generated\\steps\\409\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

let results = [];
let currentStage = null;
let currentMod = null;
let modCount = 0;

const lines = content.split('\n');

for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for stages via mappack link
    if (line.includes("Download the mappack here")) {
        if (line.includes("Grand%20Finals.zip")) currentStage = "OWC 2023 Grand Finals";
        else if (line.includes("Finals.zip")) currentStage = "OWC 2023 Finals";
        else if (line.includes("Semifinals.zip")) currentStage = "OWC 2023 Semifinals";
        else if (line.includes("Quarterfinals.zip")) currentStage = "OWC 2023 Quarterfinals";
        else if (line.includes("Round%20of%2016.zip")) currentStage = "OWC 2023 Round of 16";
        else if (line.includes("Round%20of%2032.zip")) currentStage = "OWC 2023 Round of 32";
        else if (line.includes("Qualifiers.zip")) currentStage = "OWC 2023 Qualifiers";
        
        currentMod = null;
        continue;
    }

    if (line === "- No Mod") { currentMod = "NM"; modCount = 1; continue; }
    if (line === "- Hidden") { currentMod = "HD"; modCount = 1; continue; }
    if (line === "- Hard Rock") { currentMod = "HR"; modCount = 1; continue; }
    if (line === "- Double Time") { currentMod = "DT"; modCount = 1; continue; }
    if (line === "- Free Mod") { currentMod = "FM"; modCount = 1; continue; }
    if (line === "- Tiebreaker") { currentMod = "TB"; modCount = 1; continue; }

    if (currentMod && currentStage) {
        const urlMatch = line.match(/(https:\/\/osu\.ppy\.sh\/(?:b|beatmaps|beatmapsets)\/[^\s\)\]]+)/);
        if (urlMatch && line.startsWith("[")) {
            let url = urlMatch[1];
            let bIdMatch = url.match(/#osu\/(\d+)/);
            if (bIdMatch) {
                url = "https://osu.ppy.sh/b/" + bIdMatch[1];
            }
            
            let modStr = currentMod === "TB" ? "TB" : currentMod + modCount;
            results.push([currentStage, modStr, url]);
            modCount++;
        }
    }
}

// deduplicate
let uniqueResults = [];
let seen = new Set();
for (let row of results) {
    let key = row[0] + row[1] + row[2];
    if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(row);
    }
}

console.log(`Extracted ${uniqueResults.length} maps! Injecting in batches...`);

const CHUNK_SIZE = 15;
for (let i = 0; i < uniqueResults.length; i += CHUNK_SIZE) {
    const chunk = uniqueResults.slice(i, i + CHUNK_SIZE);
    const jsonPayload = JSON.stringify({ values: chunk });
    const escapedJson = jsonPayload.replace(/"/g, '\\"');
    
    const cmd = `cmd /c "C:\\Users\\User\\Downloads\\google-workspace-cli-x86_64-pc-windows-msvc\\gws.exe sheets spreadsheets values append --params "{\\"spreadsheetId\\": \\"1Ys7vGnzaWTQvsDxAnSEj1HHwb61ldFhgL25_O0TLbrI\\", \\"range\\": \\"Sheet2!A2\\", \\"valueInputOption\\": \\"USER_ENTERED\\"}" --json "${escapedJson}""`;
    
    console.log(`Injecting batch ${Math.floor(i/CHUNK_SIZE) + 1}...`);
    execSync(cmd);
}
console.log("Finished all rounds!");
