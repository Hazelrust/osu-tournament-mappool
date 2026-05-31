import { useState } from 'react';
import { X, Copy, CheckCircle2, FileDown } from 'lucide-react';

interface ImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImporterModal({ isOpen, onClose }: ImporterModalProps) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const parseTournamentText = (text: string) => {
    const lines = text.split('\n');
    const extracted = [];
    
    for (const line of lines) {
      const urlMatch = line.match(/(https?:\/\/osu\.ppy\.sh\/(?:beatmapsets\/\d+#osu\/|beatmaps\/|b\/)\d+)/i);
      if (!urlMatch) continue;
      
      const modMatch = line.match(/\b(NM|HD|HR|DT|EZ|FL|HT|FM|TB)\d*\b/i);
      const mod = modMatch ? modMatch[0].toUpperCase() : 'NM';
      const url = urlMatch[1];
      
      extracted.push({ mod, url });
    }
    return extracted;
  };

  const results = parseTournamentText(inputText);

  const handleCopy = () => {
    // Generate TSV: Mod \t Map URL
    const tsv = results.map(r => `${r.mod}\t${r.url}`).join('\n');
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <FileDown className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Import Tournament Pool</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[60vh]">
          {/* Left: Input */}
          <div className="flex-1 p-6 border-r border-white/5 flex flex-col">
            <label className="text-sm font-semibold text-slate-300 mb-2">Paste raw text (Discord, Forum, etc)</label>
            <textarea
              className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-pink-500/50 resize-none font-mono text-sm"
              placeholder="Example:&#10;**HD1** - Some Song (https://osu.ppy.sh/beatmaps/12345)&#10;DT2: https://osu.ppy.sh/b/67890"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Right: Output */}
          <div className="flex-1 p-6 bg-white/[0.02] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-300">Detected Maps ({results.length})</label>
              {results.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'COPIED TO CLIPBOARD!' : 'COPY FOR SHEETS'}
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 overflow-y-auto">
              {results.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                  Waiting for valid osu! beatmap links...
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex gap-4 text-sm font-mono bg-white/5 p-2 rounded-md items-center">
                      <span className="text-pink-400 font-bold w-12">{r.mod}</span>
                      <span className="text-slate-400 truncate">{r.url}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              <span className="text-pink-400 font-semibold">How to use:</span> Click copy, then open your Google Sheet. Click the very first empty cell in your <span className="text-white">Mod</span> column and press <kbd className="bg-white/10 px-1 rounded text-white">Ctrl+V</kbd>. It will perfectly paste the Mods and URLs into the rows!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
