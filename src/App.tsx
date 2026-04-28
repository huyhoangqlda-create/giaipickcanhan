import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, Save, CheckCircle2, Play, Settings2, RotateCcw, ArrowLeft, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Match { court: number; t1: number[]; t2: number[]; }
interface RoundData { round: number; matches: Match[]; rest: number[]; isBonus?: boolean; }
interface TeamRule { id: string; g1: string; g2: string; }
interface MatchRule { id: string; r1: string; r2: string; }
interface TournamentConfig { 
  numPlayers: number; 
  numCourts: number; 
  numRounds: number; 
  groups: string[];
  teamRules: TeamRule[];
  matchRules?: MatchRule[];
}

type TabType = 'matches' | 'leaderboard';

export default function App() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [setupStep, setSetupStep] = useState<number>(() => {
    const saved = localStorage.getItem('pb_setupStep');
    return saved !== null ? Number(saved) : 0;
  });

  const [config, setConfig] = useState<TournamentConfig>(() => {
    const saved = localStorage.getItem('pb_config');
    if (saved) {
       const parsed = JSON.parse(saved);
       if (!parsed.groups) parsed.groups = ['Mặc định'];
       if (!parsed.teamRules) parsed.teamRules = [];
       return parsed;
    }
    return { numPlayers: 10, numCourts: 2, numRounds: 10, groups: ['Trình A', 'Trình B'], teamRules: [] };
  });

  const [players, setPlayers] = useState<Record<number, {name: string, group: string}>>(() => {
    const saved = localStorage.getItem('pb_players_v2');
    if (saved) return JSON.parse(saved);
    
    // Fallback for older version
    const oldSaved = localStorage.getItem('pb_players');
    const initial: Record<number, {name: string, group: string}> = {};
    if (oldSaved) {
       const parsed = JSON.parse(oldSaved);
       for (const k in parsed) {
          if (typeof parsed[k] === 'string') {
              initial[k] = { name: parsed[k], group: '' };
          } else {
              initial[k] = parsed[k];
          }
       }
    } else {
       for (let i = 1; i <= 10; i++) initial[i] = { name: `VĐV ${i}`, group: 'Trình A' };
    }
    return initial;
  });

  const [schedule, setSchedule] = useState<RoundData[]>(() => {
    const saved = localStorage.getItem('pb_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  const [scores, setScores] = useState<Record<string, {t1: number, t2: number}>>(() => {
    const saved = localStorage.getItem('pb_scores');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [activeTab, setActiveTab] = useState<TabType>('matches');

  // Lưu changes vào localStorage
  useEffect(() => {
    localStorage.setItem('pb_setupStep', String(setupStep));
    localStorage.setItem('pb_config', JSON.stringify(config));
    localStorage.setItem('pb_players_v2', JSON.stringify(players));
    localStorage.setItem('pb_schedule', JSON.stringify(schedule));
    localStorage.setItem('pb_scores', JSON.stringify(scores));
  }, [setupStep, config, players, schedule, scores]);

  const handleStartConfig = (newConfig: TournamentConfig) => {
    setConfig(newConfig);
    // Initialize empty names if expanding
    const newPlayers = { ...players };
    for (let i = 1; i <= newConfig.numPlayers; i++) {
       if (!newPlayers[i]) newPlayers[i] = { name: `VĐV ${i}`, group: newConfig.groups[0] || '' };
    }
    setPlayers(newPlayers);
    setSetupStep(1);
  };

  const handleStartTournament = (finalPlayers: Record<number, {name: string, group: string}>, finalConfig: TournamentConfig) => {
    setPlayers(finalPlayers);
    setConfig(finalConfig);
    
    // Tạo schedule tự động
    const newSchedule = generateMatches(
      finalConfig.numPlayers, 
      finalConfig.numCourts, 
      finalConfig.numRounds,
      finalPlayers,
      finalConfig.teamRules,
      finalConfig.matchRules
    );
    setSchedule(newSchedule);
    setScores({});
    setActiveTab('matches');
    setSetupStep(2);
  };

  const handleResetApp = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setSetupStep(0);
    setScores({});
    setSchedule([]);
    setShowResetConfirm(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans app-container max-w-md mx-auto relative shadow-[0_0_40px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 text-center flex-shrink-0 relative">
        <h1 className="text-lg font-bold tracking-[-0.5px] m-0 uppercase">Pickleball Pro Manager</h1>
        <p className="m-0 mt-1 text-[11px] opacity-70 uppercase tracking-[0.05em]">Giải đấu nội bộ - HM Pickleball</p>
        
        {setupStep === 2 && (
          <button 
            onClick={handleResetApp} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
            title="Tạo giải mới"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 bg-slate-50 relative">
        {showResetConfirm && (
          <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 max-w-[300px] w-full shadow-2xl text-center">
              <h3 className="font-bold text-lg mb-2 text-slate-800">Tạo giải mới?</h3>
              <p className="text-sm text-slate-500 mb-5">Mọi dữ liệu điểm số, lịch thi đấu và danh sách VĐV hiện tại sẽ bị xóa hoàn toàn.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors">Hủy</button>
                <button onClick={confirmReset} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-100 text-white rounded-xl font-bold transition-colors">Đồng ý</button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {setupStep === 0 && <Step0Config key="step0" initialConfig={config} onNext={handleStartConfig} />}
          {setupStep === 1 && <Step1Players key="step1" config={config} initialPlayers={players} onBack={() => setSetupStep(0)} onStart={handleStartTournament} />}
          {setupStep === 2 && activeTab === 'matches' && <MatchesTab key="matches" players={players} scores={scores} setScores={setScores} schedule={schedule} />}
          {setupStep === 2 && activeTab === 'leaderboard' && <LeaderboardTab key="leaderboard" players={players} scores={scores} schedule={schedule} config={config} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {setupStep === 2 && (
        <nav className="bg-slate-800 text-slate-400 fixed bottom-0 w-full max-w-md mx-auto z-20 pb-safe">
          <div className="grid grid-cols-2 items-center h-[60px] text-[12px] uppercase font-bold tracking-[0.05em]">
            <NavItem 
              icon={<CalendarDays size={18} />} 
              label="Thi đấu" 
              isActive={activeTab === 'matches'} 
              onClick={() => setActiveTab('matches')} 
            />
            <NavItem 
              icon={<Trophy size={18} />} 
              label="Xếp hạng" 
              isActive={activeTab === 'leaderboard'} 
              onClick={() => setActiveTab('leaderboard')} 
            />
          </div>
        </nav>
      )}
    </div>
  );
}

// ==========================================
// THUẬT TOÁN TẠO LỊCH CÔNG BẰNG & KHÔNG TRÙNG CẶP
// ==========================================

function generateMatches(
  numPlayers: number, 
  numCourts: number, 
  numRounds: number,
  players: Record<number, {name: string, group: string}>,
  teamRules: TeamRule[],
  matchRules?: MatchRule[]
): RoundData[] {
  const schedule: RoundData[] = [];
  const playCounts: Record<number, number> = {};
  const pairHistory: Record<number, Record<number, number>> = {};
  
  for (let i = 1; i <= numPlayers; i++) {
    playCounts[i] = 0;
    pairHistory[i] = {};
    for (let j = 1; j <= numPlayers; j++) {
      pairHistory[i][j] = 0;
    }
  }

  let r = 1;
  const MAX_BONUS_ROUNDS = 10;
  
  while (true) {
    const counts = Object.values(playCounts);
    const maxC = Math.max(...counts, 0);
    const minC = Math.min(...counts, 0);

    if (r > numRounds && maxC === minC) {
      break;
    }

    if (r > numRounds + MAX_BONUS_ROUNDS) {
      break;
    }

    let courtsToUse = numCourts;
    let target = maxC;
    
    if (r > numRounds) {
      let deficit = 0;
      let safeGuard = 0;
      while (safeGuard < 20) {
        deficit = counts.reduce((acc, c) => acc + (target - c), 0);
        if (deficit % 4 === 0 && deficit > 0) break;
        if (deficit === 0) break;
        target++;
        safeGuard++;
      }
      if (deficit === 0) break;

      const matchesNeeded = deficit / 4;
      courtsToUse = Math.min(numCourts, Math.max(1, matchesNeeded));
    }

    let selectedMatches: Match[] | null = null;
    let selectedResting: number[] = [];
    
    let allowedRepeat = 0;
    let attempts = 0;
    let ignoreRules = false;
    
    while (!selectedMatches && attempts < 500) {
       attempts++;
       
       if (attempts > 50) {
           allowedRepeat = Math.floor(attempts / 50);
           if (allowedRepeat > 3 && teamRules.length > 0) {
               ignoreRules = true;
           }
       }

       let playerIds = Array.from({ length: numPlayers }, (_, i) => i + 1);
       
       if (r > numRounds && attempts < 200) {
           playerIds = playerIds.filter(id => playCounts[id] < target);
       }

       for (let i = playerIds.length - 1; i > 0; i--) {
           const j = Math.floor(Math.random() * (i + 1));
           [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
       }
       
       playerIds.sort((a, b) => playCounts[a] - playCounts[b]);
       
       const neededPairs = courtsToUse * 2;
       let currentPairs: number[][] = [];
       let used = new Set<number>();
       
       for (let i = 0; i < playerIds.length && currentPairs.length < neededPairs; i++) {
           const p1 = playerIds[i];
           if (used.has(p1)) continue;
           
           let validCandidates: number[] = [];
           for (let j = i + 1; j < playerIds.length; j++) {
               const p2 = playerIds[j];
               if (used.has(p2)) continue;
               
               let isValidPair = false;
               if (ignoreRules || teamRules.length === 0) {
                   isValidPair = true;
               } else {
                   const g1 = players[p1]?.group || '';
                   const g2 = players[p2]?.group || '';
                   isValidPair = teamRules.some(rule => 
                      (rule.g1 === g1 && rule.g2 === g2) || (rule.g1 === g2 && rule.g2 === g1)
                   );
               }

               if (isValidPair && pairHistory[p1][p2] <= allowedRepeat) {
                   validCandidates.push(p2);
               }
           }
           
           if (validCandidates.length > 0) {
               const p2 = validCandidates[Math.floor(Math.random() * validCandidates.length)];
               currentPairs.push([p1, p2]);
               used.add(p1);
               used.add(p2);
           }
       }
       
       if (currentPairs.length === neededPairs) {
          const getRuleId = (p1: number, p2: number) => {
              const g1 = players[p1]?.group || '';
              const g2 = players[p2]?.group || '';
              const validRule = teamRules.find(rule => 
                 (rule.g1 === g1 && rule.g2 === g2) || (rule.g1 === g2 && rule.g2 === g1)
              );
              return validRule ? validRule.id : null;
          };

          const checkMatchup = (unmatched: number[][], currentM: Match[]): Match[] | null => {
              if (unmatched.length === 0) return currentM;
              const t1 = unmatched[0];
              for (let i = 1; i < unmatched.length; i++) {
                  const t2 = unmatched[i];
                  let isValid = true;

                  if (!ignoreRules && matchRules && matchRules.length > 0) {
                      const r1 = getRuleId(t1[0], t1[1]);
                      const r2 = getRuleId(t2[0], t2[1]);
                      if (r1 && r2) {
                          isValid = matchRules.some(m => 
                              (m.r1 === r1 && m.r2 === r2) || (m.r1 === r2 && m.r2 === r1)
                          );
                      } else {
                          // Nếu pair không thuộc team rule nào thì không hợp chuẩn MatchRule
                          isValid = false; 
                      }
                  }

                  if (isValid) {
                      const nextUnmatched = unmatched.filter((_, idx) => idx !== 0 && idx !== i);
                      const res = checkMatchup(nextUnmatched, [...currentM, { court: currentM.length + 1, t1, t2 }]);
                      if (res) return res;
                  }
              }
              return null;
          };

          for (let i = currentPairs.length - 1; i > 0; i--) {
             const j = Math.floor(Math.random() * (i + 1));
             [currentPairs[i], currentPairs[j]] = [currentPairs[j], currentPairs[i]];
          }
          
          const validMatches = checkMatchup(currentPairs, []);

          if (validMatches) {
              selectedMatches = validMatches;
              
              const allUsed = new Set<number>();
              for(const pair of currentPairs) {
                  allUsed.add(pair[0]);
                  allUsed.add(pair[1]);
              }
              const allPlayers = Array.from({ length: numPlayers }, (_, i) => i + 1);
              selectedResting = allPlayers.filter(id => !allUsed.has(id)).sort((a, b) => a - b);
              
              for (const pair of currentPairs) {
                 playCounts[pair[0]]++;
                 playCounts[pair[1]]++;
                 pairHistory[pair[0]][pair[1]]++;
                 pairHistory[pair[1]][pair[0]]++;
              }
          }
       }
    }

    if (!selectedMatches) {
        if (r === 1) alert("Không đủ VĐV hoặc quy tắc quá khắt khe để tạo trận. Vui lòng kiểm tra lại cấu hình số lượng VĐV hoặc quy tắc nhóm.");
        break;
    }
    
    schedule.push({ round: r, matches: selectedMatches, rest: selectedResting, isBonus: r > numRounds });
    r++;
  }
  
  return schedule;
}

// ==========================================
// BƯỚC 0: CẤU HÌNH GIẢI ĐẤU
// ==========================================
function Step0Config({ initialConfig, onNext }: { initialConfig: TournamentConfig, onNext: (c: TournamentConfig) => void }) {
  const [numPlayers, setNumPlayers] = useState(initialConfig.numPlayers);
  const [numCourts, setNumCourts] = useState(initialConfig.numCourts);
  const [numRounds, setNumRounds] = useState(initialConfig.numRounds);

  // Validation
  useEffect(() => {
    const maxPossCourts = Math.floor(numPlayers / 4);
    if (numCourts > maxPossCourts && maxPossCourts > 0) {
      setNumCourts(maxPossCourts);
    }
  }, [numPlayers]);

  const maxPossCourts = Math.floor(numPlayers / 4);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
      <div className="text-center mb-6 mt-4">
        <Settings2 size={40} className="mx-auto text-lime-500 mb-2" />
        <h2 className="text-xl font-bold text-slate-800 uppercase">Khởi tạo giải đấu</h2>
        <p className="text-xs text-slate-500 mt-1">Cấu hình các tham số cơ bản</p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-4 border border-slate-200 space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-[11px]">Số lượng Vận Động Viên (Tối thiểu: 4)</label>
          <input 
            type="number" min="4" max="100"
            value={numPlayers} 
            onChange={e => setNumPlayers(Math.max(4, Number(e.target.value)))}
            className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-[11px]">
            Số Sân Thi Đấu 
            {maxPossCourts < numCourts && <span className="text-red-500 ml-1">(Tối đa: {Math.max(1, maxPossCourts)})</span>}
          </label>
          <input 
            type="number" min="1" max={Math.max(1, maxPossCourts)}
            value={numCourts} 
            onChange={e => setNumCourts(Math.min(Math.max(1, maxPossCourts), Math.max(1, Number(e.target.value))))}
            className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 transition-colors"
          />
          <p className="text-[10px] text-slate-400 mt-1.5">*Mỗi sân yêu cầu 4 VĐV. Các VĐV còn thừa sẽ nghỉ xoay vòng.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-[11px]">Số Vòng Đấu</label>
          <input 
            type="number" min="1" max="50"
            value={numRounds} 
            onChange={e => setNumRounds(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 transition-colors"
          />
        </div>
      </div>

      <button 
        onClick={() => onNext({ ...initialConfig, numPlayers, numCourts, numRounds })}
        className="w-full mt-6 bg-lime-500 hover:bg-lime-600 text-white font-bold py-4 rounded-xl shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] flex items-center justify-center gap-2 uppercase tracking-wide transition-colors active:scale-[0.98]"
      >
        Tiếp theo
        <ArrowLeft className="rotate-180" size={18} />
      </button>
    </motion.div>
  );
}

// ==========================================
// BƯỚC 1: NHẬP TÊN VĐV VÀ NHÓM
// ==========================================
function Step1Players({ config, initialPlayers, onStart, onBack }: any) {
  const [groups, setGroups] = useState<string[]>(config.groups || ['Trình A', 'Trình B']);
  const [teamRules, setTeamRules] = useState<TeamRule[]>(config.teamRules || []);
  const [matchRules, setMatchRules] = useState<MatchRule[]>(config.matchRules || []);
  const [localPlayers, setLocalPlayers] = useState<Record<number, {name: string, group: string}>>(initialPlayers);

  const addGroup = () => {
    const name = prompt('Nhập tên nhóm mới (VD: Trình C):');
    if (name && !groups.includes(name)) setGroups([...groups, name]);
  };

  const removeGroup = (g: string) => {
    if (groups.length <= 1) return alert('Phải có ít nhất 1 nhóm.');
    setGroups(groups.filter(x => x !== g));
    setTeamRules(teamRules.filter(r => r.g1 !== g && r.g2 !== g));
    const newPlayers = { ...localPlayers };
    Object.keys(newPlayers).forEach(k => {
      const id = Number(k);
      if (newPlayers[id].group === g) newPlayers[id].group = groups[0] !== g ? groups[0] : groups[1];
    });
    setLocalPlayers(newPlayers);
  };

  const addRule = () => {
    if (groups.length === 0) return;
    setTeamRules([...teamRules, { id: Math.random().toString(), g1: groups[0], g2: groups[0] }]);
  };

  const updateRule = (id: string, field: 'g1' | 'g2', val: string) => {
    setTeamRules(teamRules.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const removeRule = (id: string) => {
    setTeamRules(teamRules.filter(r => r.id !== id));
    setMatchRules(matchRules.filter(m => m.r1 !== id && m.r2 !== id));
  };

  const addMatchRule = () => {
    if (teamRules.length === 0) return alert('Vui lòng tạo đội hình trước');
    setMatchRules([...matchRules, { id: Math.random().toString(), r1: teamRules[0].id, r2: teamRules[0].id }]);
  };

  const updateMatchRule = (id: string, field: 'r1' | 'r2', val: string) => {
    setMatchRules(matchRules.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const removeMatchRule = (id: string) => {
    setMatchRules(matchRules.filter(r => r.id !== id));
  };

  const start = () => {
    // Lọc bỏ các match rule không hợp lệ trước khi lưu
    const validMatchRules = matchRules.filter(m => teamRules.some(tr => tr.id === m.r1) && teamRules.some(tr => tr.id === m.r2));
    onStart(localPlayers, { ...config, groups, teamRules, matchRules: validMatchRules });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300">
          <ArrowLeft size={16} />
        </button>
        <h3 className="text-sm text-slate-500 uppercase font-bold m-0">Quản lý nhóm & VĐV</h3>
      </div>

      {/* Quản lý nhóm */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-slate-700 uppercase">1. Chia nhóm trình độ</label>
          <button onClick={addGroup} className="text-[11px] font-bold text-lime-600 bg-lime-100 px-2 py-1 flex items-center gap-1 rounded hover:bg-lime-200">
            <Plus size={12}/> Thêm nhóm
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map(g => (
            <div key={g} className="bg-white border border-slate-200 pl-3 pr-1 py-1 rounded-full flex items-center gap-2 text-sm font-semibold shadow-sm text-slate-800">
              {g}
              <button onClick={() => removeGroup(g)} className="text-slate-400 hover:text-red-500 bg-slate-100 rounded-full p-1"><X size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* Quy tắc Team */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-slate-700 uppercase">2. Đội hình hợp lệ <span className="opacity-60 normal-case ml-1">- {teamRules.length === 0 ? "Ghép tự do" : "Ghép theo luật"}</span></label>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-2">
           {teamRules.length === 0 ? (
             <p className="text-xs text-slate-500 mb-3">Hiện tại chưa có luật ghép cặp nào. Hệ thống sẽ ghép ngẫu nhiên bất kỳ VĐV nào với nhau.</p>
           ) : (
             <div className="space-y-2 mb-3">
               {teamRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <select value={rule.g1} onChange={(e) => updateRule(rule.id, 'g1', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none">
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="text-xs font-bold text-slate-400">+</span>
                    <select value={rule.g2} onChange={(e) => updateRule(rule.id, 'g2', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none">
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={() => removeRule(rule.id)} className="p-1 px-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"><X size={14}/></button>
                  </div>
               ))}
             </div>
           )}
           <button onClick={addRule} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-lime-400 hover:text-lime-600 transition-colors flex items-center justify-center gap-1">
              <Plus size={14} /> Thêm đội hình hợp lệ
           </button>
        </div>
      </div>

      {/* Quy tắc ghép cặp đôi */}
      {teamRules.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase">3. Quy tắc ghép trận hợp lệ <span className="opacity-60 normal-case ml-1">- {matchRules.length === 0 ? "Bất kỳ đội nào cũng có thể đấu nhau" : "Đấu theo luật cấu hình"}</span></label>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-2">
            {matchRules.length === 0 ? (
              <p className="text-xs text-slate-500 mb-3">Hệ thống sẽ cho phép các đội hợp lệ thi đấu với nhau một cách ngẫu nhiên.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {matchRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <select value={rule.r1} onChange={(e) => updateMatchRule(rule.id, 'r1', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none">
                      {teamRules.map(tr => <option key={tr.id} value={tr.id}>{tr.g1} + {tr.g2}</option>)}
                    </select>
                    <span className="text-xs font-bold text-amber-500">VS</span>
                    <select value={rule.r2} onChange={(e) => updateMatchRule(rule.id, 'r2', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none">
                      {teamRules.map(tr => <option key={tr.id} value={tr.id}>{tr.g1} + {tr.g2}</option>)}
                    </select>
                    <button onClick={() => removeMatchRule(rule.id)} className="p-1 px-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={addMatchRule} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1">
              <Plus size={14} /> Thêm cặp đấu hợp lệ
            </button>
          </div>
        </div>
      )}

      {/* Danh sách VĐV */}
      <div className="mb-6">
        <label className="text-[11px] font-bold text-slate-700 uppercase mb-2 block">{teamRules.length > 0 ? "4" : "3"}. Danh sách VĐV ({config.numPlayers})</label>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {Array.from({ length: config.numPlayers }).map((_, i) => {
            const id = i + 1;
            const pGroup = localPlayers[id]?.group || groups[0];
            return (
              <div key={id} className="flex items-center p-3 border-b border-slate-100 last:border-0 relative gap-3">
                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-700 rounded-full font-bold text-[10px]">
                  {id}
                </span>
                <input
                  type="text"
                  value={localPlayers[id]?.name || ''}
                  onChange={(e) => setLocalPlayers({ ...localPlayers, [id]: { ...localPlayers[id], name: e.target.value, group: localPlayers[id]?.group || groups[0] } })}
                  className="flex-[2] bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold focus:border-lime-500 focus:outline-none focus:bg-white"
                  placeholder={`Tên VĐV ${id}`}
                />
                {groups.length > 0 && (
                  <select 
                    value={pGroup}
                    onChange={(e) => setLocalPlayers({ ...localPlayers, [id]: { ...localPlayers[id], group: e.target.value } })}
                    className={`flex-1 min-w-0 bg-transparent border-none text-xs font-bold outline-none cursor-pointer p-0 m-0 focus:ring-0 ${pGroup === groups[0] ? 'text-blue-600' : pGroup === groups[1] ? 'text-amber-600' : 'text-emerald-600'}`}
                  >
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <button
        onClick={start}
        className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] text-white font-bold py-4 rounded-xl transition-colors active:scale-[0.98] uppercase tracking-wide sticky bottom-4 z-10"
      >
        <Play className="fill-current" size={18} />
        Bắt đầu xếp lịch
      </button>
    </motion.div>
  );
}

// ==========================================
// THÀNH PHẦN TAB: CÀI ĐẶT VĐV SAU KHI START ĐÃ BỊ LOẠI BỎ THEO YÊU CẦU
// ==========================================

// ==========================================
// THÀNH PHẦN TAB: THI ĐẤU (Matches)
// ==========================================
function MatchesTab({ players, scores, setScores, schedule }: { players: Record<number, {name: string, group: string}>, scores: any, setScores: any, schedule: RoundData[] }) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundData = schedule.find(r => r.round === selectedRound);

  if (!roundData) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="m-0 text-base font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
          Vòng thi đấu: {String(selectedRound).padStart(2, '0')}
          {roundData.isBonus && <span className="text-[11px] bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap hidden min-[360px]:inline-block">(Bổ sung)</span>}
        </h2>
        <select 
          value={selectedRound} 
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          className="px-3 py-1.5 rounded-md border border-slate-300 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 max-w-[120px]"
        >
          {schedule.map(r => (
            <option key={r.round} value={r.round}>Vòng {r.round} {r.isBonus ? '(Phụ)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        {roundData.matches.map((match) => (
          <MatchCard 
            key={`${selectedRound}-${match.court}`}
            round={selectedRound}
            court={match.court}
            t1={match.t1}
            t2={match.t2}
            players={players}
            scores={scores}
            setScores={setScores}
          />
        ))}
        {roundData.matches.length === 0 && (
           <p className="text-center text-sm text-slate-400 py-4">Không đủ người để xếp trận đôi.</p>
        )}
      </div>

      {roundData.rest.length > 0 && (
        <div className="my-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2.5">Đang nghỉ vòng này:</span>
          <div className="flex flex-wrap gap-2">
            {roundData.rest.map(id => (
              <span key={id} className="bg-red-50 text-red-500 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-red-100">
                {players[id]?.name || `P${id}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MatchCard({ round, court, t1, t2, players, scores, setScores }: any) {
  const matchKey = `${round}-${court}`;
  const currentScore = scores[matchKey] || { t1: '', t2: '' };
  
  const [localT1, setLocalT1] = useState<string | number>(currentScore.t1);
  const [localT2, setLocalT2] = useState<string | number>(currentScore.t2);
  const [saved, setSaved] = useState(false);

  // Sync when round changes
  useEffect(() => {
    setLocalT1(scores[matchKey]?.t1 ?? '');
    setLocalT2(scores[matchKey]?.t2 ?? '');
  }, [matchKey, scores]);

  const handleUpdate = () => {
    setScores((prev: any) => ({
      ...prev,
      [matchKey]: { 
        t1: localT1 === '' ? 0 : Number(localT1), 
        t2: localT2 === '' ? 0 : Number(localT2) 
      }
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-1.5">
        <span className="font-extrabold text-slate-700 text-sm uppercase">Sân thi đấu {court}</span>
      </div>
      <div className="grid grid-cols-[1fr_40px_1fr] gap-2.5 items-center">
        <div className="text-center overflow-hidden">
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t1[0]]?.name} <span className="opacity-50 text-[10px]">(P{t1[0]}{players[t1[0]]?.group ? ` - ${players[t1[0]].group}` : ''})</span></span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t1[1]]?.name} <span className="opacity-50 text-[10px]">(P{t1[1]}{players[t1[1]]?.group ? ` - ${players[t1[1]].group}` : ''})</span></span>
          <input 
            type="number" 
            value={localT1} 
            onChange={e => setLocalT1(e.target.value)}
            className="w-full text-center py-2.5 text-lg font-bold border-2 border-slate-200 rounded-lg bg-white mt-1 focus:outline-none focus:border-lime-500"
            placeholder="0"
          />
        </div>
        <div className="text-center font-black text-slate-400">VS</div>
        <div className="text-center overflow-hidden">
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t2[0]]?.name} <span className="opacity-50 text-[10px]">(P{t2[0]}{players[t2[0]]?.group ? ` - ${players[t2[0]].group}` : ''})</span></span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t2[1]]?.name} <span className="opacity-50 text-[10px]">(P{t2[1]}{players[t2[1]]?.group ? ` - ${players[t2[1]].group}` : ''})</span></span>
          <input 
            type="number" 
            value={localT2} 
            onChange={e => setLocalT2(e.target.value)}
            className="w-full text-center py-2.5 text-lg font-bold border-2 border-slate-200 rounded-lg bg-white mt-1 focus:outline-none focus:border-lime-500"
            placeholder="0"
          />
        </div>
      </div>
      <button 
        onClick={handleUpdate}
        className={`w-full p-3.5 border-none rounded-lg font-bold text-base mt-2.5 shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] transition-colors active:scale-[0.98]
          ${saved ? 'bg-lime-600 text-white' : 'bg-lime-500 text-white hover:bg-lime-600'}`}
      >
        {saved ? 'ĐÃ LƯU ĐIỂM!' : 'CẬP NHẬT ĐIỂM SỐ'}
      </button>
    </div>
  );
}

// ==========================================
// THÀNH PHẦN TAB: BẢNG XẾP HẠNG
// ==========================================
function LeaderboardTab({ players, scores, schedule, config }: { players: Record<number, {name: string, group: string}>, scores: any, schedule: RoundData[], config: TournamentConfig }) {
  
  // Calculate scores for all players
  const leaderboard = Array.from({ length: config.numPlayers }).map((_, i) => {
    const id = i + 1;
    let total = 0;
    const roundScores: Record<number, number> = {};

    schedule.forEach(roundData => {
      roundData.matches.forEach(match => {
        const matchKey = `${roundData.round}-${match.court}`;
        const matchScore = scores[matchKey];
        if (matchScore) {
          if (match.t1.includes(id)) {
            total += matchScore.t1;
            roundScores[roundData.round] = matchScore.t1;
          } else if (match.t2.includes(id)) {
            total += matchScore.t2;
            roundScores[roundData.round] = matchScore.t2;
          }
        }
      });
    });

    return { id, name: players[id]?.name, group: players[id]?.group, total, roundScores };
  });

  // Sort descending
  leaderboard.sort((a, b) => b.total - a.total);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
      <h3 className="text-sm text-slate-500 mb-2 uppercase font-bold">Xếp hạng hiện tại</h3>
      
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px] min-w-max">
          <thead>
            <tr>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200 w-10 text-center sticky left-0 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.02)] z-10">HẠNG</th>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200 sticky left-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.02)] z-10">TÊN VĐV</th>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200 text-right pr-4 bg-white z-10">TỔNG</th>
              {schedule.map((r) => (
                 <th key={r.round} className="p-2 font-semibold text-slate-400 border-b-2 border-slate-200 text-center whitespace-nowrap">V{r.round}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              let rowBg = '';
              if (rank === 1) rowBg = 'bg-[#fef9c3]';
              
              let rankStyle = 'inline-block w-6 h-6 leading-6 text-center rounded-full font-bold text-[11px]';
              if (rank === 1) rankStyle += ' bg-amber-400 text-white';
              else if (rank === 2) rankStyle += ' bg-slate-400 text-white';
              else if (rank === 3) rankStyle += ' bg-amber-700 text-white';
              else rankStyle += ' bg-slate-200 text-slate-600';

              return (
                <tr key={player.id} className={`border-b border-slate-100 ${rowBg}`}>
                  <td className={`p-2 py-2.5 text-center sticky left-0 z-10 ${rowBg || 'bg-white'}`}>
                    <span className={rankStyle}>{rank}</span>
                  </td>
                  <td className={`p-2 py-2.5 font-bold text-slate-800 whitespace-nowrap sticky left-10 z-10 ${rowBg || 'bg-white'} shadow-[2px_0_4px_rgba(0,0,0,0.02)]`}>
                    {player.name} <span className="opacity-60 font-normal text-[10px] block -mt-1">{player.group} (P{player.id})</span>
                  </td>
                  <td className={`p-2 py-2.5 font-bold text-slate-800 text-right pr-4 ${rowBg || 'bg-white'} z-0`}>
                    {player.total}
                  </td>
                  {schedule.map((r) => (
                    <td key={r.round} className={`p-2 py-2.5 text-center text-slate-500 ${rowBg || 'bg-white'} z-0`}>
                      {player.roundScores[r.round] !== undefined ? player.roundScores[r.round] : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 text-center">© Hoàng Mai Pickleball</p>
    </motion.div>
  );
}

// ==========================================
// THÀNH PHẦN PHỤ TRỢ
// ==========================================
function NavItem({ icon, label, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-white border-b-[3px] border-lime-500' : 'text-slate-400 hover:text-slate-300 border-b-[3px] border-transparent'}`}
    >
      <div className={`mb-0.5 transition-transform ${isActive ? 'scale-110 text-lime-400' : ''}`}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}
