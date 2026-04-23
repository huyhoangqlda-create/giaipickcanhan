import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, Users, Save, CheckCircle2, Play, Settings2, RotateCcw, ArrowLeft, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Match { court: number; t1: number[]; t2: number[]; }
interface RoundData { round: number; matches: Match[]; rest: number[]; }
interface TournamentConfig { numPlayers: number; numCourts: number; numRounds: number; }

type TabType = 'matches' | 'leaderboard';

export default function App() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [setupStep, setSetupStep] = useState<number>(() => {
    const saved = localStorage.getItem('pb_setupStep');
    return saved !== null ? Number(saved) : 0;
  });

  const [config, setConfig] = useState<TournamentConfig>(() => {
    const saved = localStorage.getItem('pb_config');
    return saved ? JSON.parse(saved) : { numPlayers: 10, numCourts: 2, numRounds: 10 };
  });

  const [players, setPlayers] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('pb_players');
    if (saved) return JSON.parse(saved);
    const initial: Record<number, string> = {};
    for (let i = 1; i <= 10; i++) initial[i] = `VĐV ${i}`;
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
    localStorage.setItem('pb_players', JSON.stringify(players));
    localStorage.setItem('pb_schedule', JSON.stringify(schedule));
    localStorage.setItem('pb_scores', JSON.stringify(scores));
  }, [setupStep, config, players, schedule, scores]);

  const handleStartConfig = (newConfig: TournamentConfig) => {
    setConfig(newConfig);
    // Initialize empty names if expanding
    const newPlayers = { ...players };
    for (let i = 1; i <= newConfig.numPlayers; i++) {
       if (!newPlayers[i]) newPlayers[i] = `VĐV ${i}`;
    }
    setPlayers(newPlayers);
    setSetupStep(1);
  };

  const handleStartTournament = (finalPlayers: Record<number, string>) => {
    setPlayers(finalPlayers);
    
    // Tạo schedule tự động
    const newSchedule = generateMatches(config.numPlayers, config.numCourts, config.numRounds);
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
// THUẬT TOÁN TẠO LỊCH CÔNG BẰNG & NGẪU NHIÊN
// ==========================================
function generateMatches(numPlayers: number, numCourts: number, numRounds: number): RoundData[] {
  const schedule: RoundData[] = [];
  const playCounts: Record<number, number> = {};
  for (let i = 1; i <= numPlayers; i++) playCounts[i] = 0;

  const playersPerRound = numCourts * 4;
  
  for (let r = 1; r <= numRounds; r++) {
    // 1. Tạo mảng ID
    const playerIds = Array.from({ length: numPlayers }, (_, i) => i + 1);
    
    // 2. Xáo trộn ngẫu nhiên tất cả các VĐV (Fisher-Yates) để bẻ gãy thứ tự
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }

    // 3. Ưu tiên những người có số lượt chơi ít hơn (đảm bảo tính công bằng)
    playerIds.sort((a, b) => playCounts[a] - playCounts[b]);

    // 4. Chọn người được chơi và người nghỉ vòng này
    const playingThisRound = playerIds.slice(0, playersPerRound);
    const restingThisRound = playerIds.slice(playersPerRound).sort((a, b) => a - b);

    // Cập nhật thống kê lượt ra sân
    playingThisRound.forEach(id => playCounts[id]++);

    // 5. Xáo trộn lại nhóm người được chọn để chia cặp/số trận thật ngẫu nhiên
    for (let i = playingThisRound.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playingThisRound[i], playingThisRound[j]] = [playingThisRound[j], playingThisRound[i]];
    }

    const matches: Match[] = [];
    let pIndex = 0;
    
    // 6. Xếp các VĐV vào sân
    for (let c = 1; c <= numCourts; c++) {
      if (pIndex + 4 <= playingThisRound.length) {
        matches.push({
          court: c,
          t1: [playingThisRound[pIndex], playingThisRound[pIndex + 1]],
          t2: [playingThisRound[pIndex + 2], playingThisRound[pIndex + 3]]
        });
        pIndex += 4;
      }
    }
    
    // 7. Lưu lại lịch
    schedule.push({ round: r, matches, rest: restingThisRound });
  }
  
  return schedule;
}

// ==========================================
// BƯỚC 0: CẤU HÌNH GIẢI ĐẤU
// ==========================================
function Step0Config({ initialConfig, onNext }: { initialConfig: TournamentConfig, onNext: (c: TournamentConfig) => void, key?: string }) {
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
        
        {/* Số VĐV */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase text-[11px]">Số lượng Vận Động Viên (Tối thiểu: 4)</label>
          <input 
            type="number" min="4" max="100"
            value={numPlayers} 
            onChange={e => setNumPlayers(Math.max(4, Number(e.target.value)))}
            className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-lime-500 transition-colors"
          />
        </div>

        {/* Số Sân */}
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

        {/* Số Vòng */}
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
        onClick={() => onNext({ numPlayers, numCourts, numRounds })}
        className="w-full mt-6 bg-lime-500 hover:bg-lime-600 text-white font-bold py-4 rounded-xl shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] flex items-center justify-center gap-2 uppercase tracking-wide transition-colors active:scale-[0.98]"
      >
        Tiếp theo
        <ArrowLeft className="rotate-180" size={18} />
      </button>
    </motion.div>
  );
}

// ==========================================
// BƯỚC 1: NHẬP TÊN VĐV
// ==========================================
function Step1Players({ config, initialPlayers, onStart, onBack }: any) {
  const [localPlayers, setLocalPlayers] = useState<Record<number, string>>(initialPlayers);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300">
          <ArrowLeft size={16} />
        </button>
        <h3 className="text-sm text-slate-500 uppercase font-bold m-0">Nhập danh sách VĐV ({config.numPlayers})</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl mb-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        {Array.from({ length: config.numPlayers }).map((_, i) => {
          const id = i + 1;
          return (
            <div key={id} className="flex items-center p-3 border-b border-slate-100 last:border-0">
              <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-700 rounded-full font-bold text-xs mr-3">
                {id}
              </span>
              <input
                type="text"
                value={localPlayers[id] || ''}
                onChange={(e) => setLocalPlayers({ ...localPlayers, [id]: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-semibold focus:border-lime-500 focus:outline-none focus:bg-white"
                placeholder={`Tên VĐV ${id}`}
              />
            </div>
          );
        })}
      </div>
      
      <button
        onClick={() => onStart(localPlayers)}
        className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] text-white font-bold py-4 rounded-xl transition-colors active:scale-[0.98] uppercase tracking-wide"
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
function MatchesTab({ players, scores, setScores, schedule }: { players: Record<number, string>, scores: any, setScores: any, schedule: RoundData[], key?: string }) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundData = schedule.find(r => r.round === selectedRound);

  if (!roundData) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="m-0 text-base font-bold text-slate-800">Vòng thi đấu: {String(selectedRound).padStart(2, '0')}</h2>
        <select 
          value={selectedRound} 
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          className="px-3 py-1.5 rounded-md border border-slate-300 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          {schedule.map(r => (
            <option key={r.round} value={r.round}>Vòng {r.round}</option>
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
                {players[id]} (P{id})
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
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t1[0]]} <span className="opacity-50 text-[10px]">(P{t1[0]})</span></span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t1[1]]} <span className="opacity-50 text-[10px]">(P{t1[1]})</span></span>
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
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t2[0]]} <span className="opacity-50 text-[10px]">(P{t2[0]})</span></span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800 truncate">{players[t2[1]]} <span className="opacity-50 text-[10px]">(P{t2[1]})</span></span>
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
function LeaderboardTab({ players, scores, schedule, config }: { players: Record<number, string>, scores: any, schedule: RoundData[], config: TournamentConfig, key?: string }) {
  
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

    return { id, name: players[id], total, roundScores };
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
              {Array.from({ length: config.numRounds }).map((_, i) => (
                 <th key={i} className="p-2 font-semibold text-slate-400 border-b-2 border-slate-200 text-center">V{i+1}</th>
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
                    {player.name} <span className="opacity-60 font-normal text-xs">(P{player.id})</span>
                  </td>
                  <td className={`p-2 py-2.5 font-bold text-slate-800 text-right pr-4 ${rowBg || 'bg-white'} z-0`}>
                    {player.total}
                  </td>
                  {Array.from({ length: config.numRounds }).map((_, i) => (
                    <td key={i} className={`p-2 py-2.5 text-center text-slate-500 ${rowBg || 'bg-white'} z-0`}>
                      {player.roundScores[i+1] !== undefined ? player.roundScores[i+1] : '-'}
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
