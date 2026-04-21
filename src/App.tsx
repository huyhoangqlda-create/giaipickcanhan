import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, Users, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Ma trận lịch thi đấu theo yêu cầu
const SCHEDULE = [
  { round: 1, rest: [1, 6], matches: [{ court: 1, t1: [2, 10], t2: [3, 9] }, { court: 2, t1: [4, 8], t2: [5, 7] }] },
  { round: 2, rest: [2, 7], matches: [{ court: 1, t1: [3, 1], t2: [4, 10] }, { court: 2, t1: [5, 9], t2: [6, 8] }] },
  { round: 3, rest: [3, 8], matches: [{ court: 1, t1: [4, 2], t2: [5, 1] }, { court: 2, t1: [6, 10], t2: [7, 9] }] },
  { round: 4, rest: [4, 9], matches: [{ court: 1, t1: [5, 3], t2: [6, 2] }, { court: 2, t1: [7, 1], t2: [8, 10] }] },
  { round: 5, rest: [5, 10], matches: [{ court: 1, t1: [6, 4], t2: [7, 3] }, { court: 2, t1: [8, 2], t2: [9, 1] }] },
  { round: 6, rest: [1, 6], matches: [{ court: 1, t1: [7, 5], t2: [8, 4] }, { court: 2, t1: [9, 3], t2: [10, 2] }] },
  { round: 7, rest: [2, 7], matches: [{ court: 1, t1: [8, 6], t2: [9, 5] }, { court: 2, t1: [10, 4], t2: [1, 3] }] },
  { round: 8, rest: [3, 8], matches: [{ court: 1, t1: [9, 7], t2: [10, 6] }, { court: 2, t1: [1, 5], t2: [2, 4] }] },
  { round: 9, rest: [4, 9], matches: [{ court: 1, t1: [10, 8], t2: [1, 7] }, { court: 2, t1: [2, 6], t2: [3, 5] }] },
  { round: 10, rest: [5, 10], matches: [{ court: 1, t1: [1, 9], t2: [2, 8] }, { court: 2, t1: [3, 7], t2: [4, 6] }] },
];

type TabType = 'settings' | 'matches' | 'leaderboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  
  // State: Tên Vận động viên
  const [players, setPlayers] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('pb_players');
    if (saved) return JSON.parse(saved);
    const initial: Record<number, string> = {};
    for (let i = 1; i <= 10; i++) initial[i] = `VĐV ${i}`;
    return initial;
  });

  // State: Điểm số các trận (Key: "round-court", Value: {t1, t2})
  const [scores, setScores] = useState<Record<string, {t1: number, t2: number}>>(() => {
    const saved = localStorage.getItem('pb_scores');
    if (saved) return JSON.parse(saved);
    return {};
  });

  // Lưu changes vào localStorage
  useEffect(() => {
    localStorage.setItem('pb_players', JSON.stringify(players));
    localStorage.setItem('pb_scores', JSON.stringify(scores));
  }, [players, scores]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans app-container max-w-md mx-auto relative shadow-[0_0_40px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 text-center flex-shrink-0">
        <h1 className="text-lg font-bold tracking-[-0.5px] m-0 uppercase">Pickleball Pro Manager</h1>
        <p className="m-0 mt-1 text-[11px] opacity-70 uppercase tracking-[0.05em]">Giải đấu nội bộ - Round Robin</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 bg-slate-50">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && <SettingsTab key="settings" players={players} setPlayers={setPlayers} />}
          {activeTab === 'matches' && <MatchesTab key="matches" players={players} scores={scores} setScores={setScores} />}
          {activeTab === 'leaderboard' && <LeaderboardTab key="leaderboard" players={players} scores={scores} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-800 text-slate-400 fixed bottom-0 w-full max-w-md mx-auto z-20 pb-safe">
        <div className="flex justify-around items-center h-[60px] text-[12px] uppercase font-bold tracking-[0.05em]">
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
          <NavItem 
            icon={<Users size={18} />} 
            label="VĐV" 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </nav>
    </div>
  );
}

// ==========================================
// THÀNH PHẦN 1: CÀI ĐẶT VĐV
// ==========================================
function SettingsTab({ players, setPlayers }: { players: Record<number, string>, setPlayers: any, key?: string }) {
  const [localPlayers, setLocalPlayers] = useState(players);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setPlayers(localPlayers);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      <h3 className="text-sm text-slate-500 mb-3 uppercase font-bold">Cài đặt VĐV</h3>
      <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        {Array.from({ length: 10 }).map((_, i) => {
          const id = i + 1;
          return (
            <div key={id} className="flex items-center p-3 border-b border-slate-100 last:border-0">
              <span className="w-7 h-7 flex items-center justify-center bg-slate-200 text-slate-700 rounded-full font-bold text-xs mr-3">
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
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 shadow-[0_4px_6px_-1px_rgba(132,204,22,0.2)] text-white font-bold py-3.5 px-4 rounded-lg transition-colors active:scale-[0.98]"
      >
        {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saved ? 'ĐÃ LƯU THÀNH CÔNG' : 'LƯU DANH SÁCH VĐV'}
      </button>
    </motion.div>
  );
}

// ==========================================
// THÀNH PHẦN 2: THI ĐẤU (Matches)
// ==========================================
function MatchesTab({ players, scores, setScores }: { players: Record<number, string>, scores: any, setScores: any, key?: string }) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundData = SCHEDULE.find(r => r.round === selectedRound)!;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="m-0 text-base font-bold text-slate-800">Vòng thi đấu: {String(selectedRound).padStart(2, '0')}</h2>
        <select 
          value={selectedRound} 
          onChange={(e) => setSelectedRound(Number(e.target.value))}
          className="px-3 py-1.5 rounded-md border border-slate-300 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
        >
          {SCHEDULE.map(r => (
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
      </div>

      <div className="my-4">
        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2.5">Đang nghỉ vòng này:</span>
        <div className="flex gap-2">
          {roundData.rest.map(id => (
            <span key={id} className="bg-red-50 text-red-500 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-red-100">
              {players[id]} (P{id})
            </span>
          ))}
        </div>
      </div>
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
        <span className="text-[11px] text-slate-500 font-medium">12:00 PHÚT</span>
      </div>
      <div className="grid grid-cols-[1fr_40px_1fr] gap-2.5 items-center">
        <div className="text-center">
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800">{players[t1[0]]} (P{t1[0]})</span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800">{players[t1[1]]} (P{t1[1]})</span>
          <input 
            type="number" 
            value={localT1} 
            onChange={e => setLocalT1(e.target.value)}
            className="w-full text-center py-2.5 text-lg font-bold border-2 border-slate-200 rounded-lg bg-white mt-1 focus:outline-none focus:border-lime-500"
            placeholder="0"
          />
        </div>
        <div className="text-center font-black text-slate-400">VS</div>
        <div className="text-center">
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800">{players[t2[0]]} (P{t2[0]})</span>
          <span className="bg-slate-100 rounded-md p-1.5 my-1 text-[13px] font-semibold block text-slate-800">{players[t2[1]]} (P{t2[1]})</span>
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
// THÀNH PHẦN 3: BẢNG XẾP HẠNG
// ==========================================
function LeaderboardTab({ players, scores }: { players: Record<number, string>, scores: any, key?: string }) {
  
  // Calculate scores for all players
  const leaderboard = Array.from({ length: 10 }).map((_, i) => {
    const id = i + 1;
    let total = 0;
    const roundScores: Record<number, number> = {};

    SCHEDULE.forEach(roundData => {
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
      // Nếu không có điểm trận này do nghỉ hoặc chưa nhập, giá trị là undefined hoặc '-'
    });

    return { id, name: players[id], total, roundScores };
  });

  // Sort descending
  leaderboard.sort((a, b) => b.total - a.total);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      <h3 className="text-sm text-slate-500 mb-2 uppercase font-bold">Xếp hạng hiện tại</h3>
      
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200 w-10 text-center">HẠNG</th>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200">TÊN VĐV</th>
              <th className="p-2 font-semibold text-slate-500 border-b-2 border-slate-200 text-right pr-4">TỔNG</th>
              {/* Dynamic round headers if want to scroll sideways */}
              {Array.from({ length: 10 }).map((_, i) => (
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
                  <td className="p-2 py-2.5 text-center">
                    <span className={rankStyle}>{rank}</span>
                  </td>
                  <td className="p-2 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                    {player.name} <span className="opacity-60 font-normal text-xs">(P{player.id})</span>
                  </td>
                  <td className="p-2 py-2.5 font-bold text-slate-800 text-right pr-4">
                    {player.total}
                  </td>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <td key={i} className="p-2 py-2.5 text-center text-slate-500">
                      {player.roundScores[i+1] !== undefined ? player.roundScores[i+1] : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 text-center">© 2024 Pickleball Apps Script System</p>
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
