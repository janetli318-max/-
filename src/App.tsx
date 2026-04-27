/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Shuffle, 
  Trash2, 
  Copy, 
  Check, 
  LayoutGrid, 
  Settings2,
  Share2
} from 'lucide-react';

type GroupingMode = 'count' | 'size';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [groupCount, setGroupCount] = useState(4);
  const [mode, setMode] = useState<GroupingMode>('count');
  const [resultGroups, setResultGroups] = useState<string[][]>([]);
  const [hasCopied, setHasCopied] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Sample data for template
  const sampleNames = `陳小明
林志玲
王大同
李美美
張學友
周杰倫
蔡依林
謝霆鋒
劉德華
郭富城
黎明
金城武`;

  const handleLoadTemplate = () => {
    setInputText(sampleNames);
    setResultGroups([]);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
      
      if (lines.length === 0) return;

      // 嘗試偵測分隔符 (逗號, Tab, 或分號)
      const firstLine = lines[0];
      const delimiters = [',', '\t', ';'];
      let delimiter = ',';
      let maxCols = 0;
      
      for (const d of delimiters) {
        const cols = firstLine.split(d).length;
        if (cols > maxCols) {
          maxCols = cols;
          delimiter = d;
        }
      }

      const rows = lines.map(line => line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '')));
      
      // 尋找標題索引
      const headers = rows[0];
      const idIndex = headers.findIndex(h => h.includes('員工號') || h.includes('工號') || h.toLowerCase() === 'id');
      const nameIndex = headers.findIndex(h => h.includes('員工姓名') || h.includes('姓名') || h.toLowerCase().includes('name'));

      let processedList: string[] = [];

      if (idIndex !== -1 || nameIndex !== -1) {
        // 有標題的情況
        processedList = rows.slice(1).map(row => {
          const parts = [];
          if (idIndex !== -1 && row[idIndex]) parts.push(row[idIndex]);
          if (nameIndex !== -1 && row[nameIndex]) parts.push(row[nameIndex]);
          return parts.join(' ');
        }).filter(item => item !== '');
      } else if (maxCols >= 2) {
        // 無標題但有多個欄位，假設前兩欄是 ID 和姓名
        processedList = rows.map(row => {
          return `${row[0]} ${row[1]}`.trim();
        }).filter(item => item !== '');
      } else {
        // 單欄，當作純文字處理
        processedList = lines;
      }

      setInputText(processedList.join('\n'));
      setResultGroups([]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Parse names from input
  const names = useMemo(() => {
    return inputText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
  }, [inputText]);

  const handleGroup = () => {
    if (names.length === 0) return;

    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const groups: string[][] = [];

    if (mode === 'count') {
      const gCount = Math.min(groupCount, names.length);
      for (let i = 0; i < gCount; i++) {
        groups.push([]);
      }
      shuffled.forEach((name, index) => {
        groups[index % gCount].push(name);
      });
    } else {
      const gSize = Math.max(1, groupCount);
      for (let i = 0; i < shuffled.length; i += gSize) {
        groups.push(shuffled.slice(i, i + gSize));
      }
    }

    setResultGroups(groups);
  };

  const handleClear = () => {
    setInputText('');
    setResultGroups([]);
  };

  const copyToClipboard = () => {
    if (resultGroups.length === 0) return;
    
    const text = resultGroups
      .map((group, idx) => `Group ${idx + 1}:\n${group.join(', ')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (resultGroups.length === 0) return;

    let csvContent = "\ufeff"; // Add BOM for Excel UTF-8 support
    csvContent += "組別,成員\n";
    
    resultGroups.forEach((group, idx) => {
      group.forEach(member => {
        // Escape quotes for CSV
        const escapedMember = member.replace(/"/g, '""');
        csvContent += `第 ${idx + 1} 組,"${escapedMember}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `group_results_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg">G</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            智能分組工具 
            <span className="text-blue-600 font-medium text-sm hidden sm:inline">Smart Grouping</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLoadTemplate}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            載入範本
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={resultGroups.length === 0}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-100"
          >
            <Share2 className="w-4 h-4" />
            匯出結果 (CSV)
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* Left Sidebar: Configuration */}
        <section className="w-80 flex flex-col gap-6 h-full">
          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5" />
                成員名單 ({names.length})
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1">
                  匯入
                  <input 
                    type="file" 
                    accept=".txt,.csv" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
                <button 
                  onClick={handleClear}
                  className="text-xs text-rose-500 font-semibold hover:text-rose-600 transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="請輸入姓名，每行一個..."
              className="flex-1 w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-4 custom-scrollbar"
              id="name-input"
            />
            
            <div className="space-y-5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">分組方式</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setMode('count')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      mode === 'count' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    固定組數
                  </button>
                  <button
                    onClick={() => setMode('size')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      mode === 'size' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    每組人數
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  目標數量 ({mode === 'count' ? '組數' : '人數'})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={Math.max(12, names.length)}
                    value={groupCount}
                    onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="w-10 text-center">
                    <span className="text-lg font-bold text-blue-600">{groupCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGroup}
            disabled={names.length === 0}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            id="mix-button"
          >
            <span>開始隨機分組</span>
            <Shuffle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </section>

        {/* Main Workspace: Groups Display */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0 px-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-500" />
              分組結果預覽
            </h2>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> 
                已分配 {names.length}
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div> 
                組數 {resultGroups.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {resultGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min pb-4">
                <AnimatePresence mode="popLayout">
                  {resultGroups.map((group, groupIdx) => (
                    <motion.div
                      key={`group-${groupIdx}-${group.join('-')}`}
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="group-card"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900">
                          第 {groupIdx + 1} 組 (Group {String.fromCharCode(65 + groupIdx)})
                        </h3>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          {group.length} 人
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.map((name, nameIdx) => (
                          <motion.span
                            key={nameIdx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="participant-chip"
                          >
                            {name}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/40 rounded-3xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4 rotate-3 opacity-50">
                  <LayoutGrid className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-500 font-bold mb-1">尚未生成分組</h3>
                <p className="text-sm text-slate-400">在左側側邊欄編輯名單並點擊開始分組</p>
              </div>
            )}
          </div>

          {resultGroups.length > 0 && (
             <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-blue-800 shrink-0">
                <div className="flex gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600/60 uppercase tracking-wider block mb-0.5">平均人數</span> 
                    <p className="font-bold text-sm">{(names.length / resultGroups.length).toFixed(1)} 人</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600/60 uppercase tracking-wider block mb-0.5">最大規模</span> 
                    <p className="font-bold text-sm">{Math.max(...resultGroups.map(g => g.length))} 人</p>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-blue-600/50 italic">Generated on {new Date().toLocaleDateString()}</p>
             </div>
          )}
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
