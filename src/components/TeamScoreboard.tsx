import React, { useState } from 'react';
import { Team } from '../types/quiz';
import { Plus, Trash2, RotateCcw, Trophy, Award, Shield, Check } from 'lucide-react';

interface TeamScoreboardProps {
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (id: string) => void;
  onUpdateTeam: (team: Team) => void;
  onAddTeam: (name: string, color: Team['color']) => void;
  onDeleteTeam: (id: string) => void;
  onResetScores: () => void;
  onStartQuiz: () => void;
}

const COLOR_CLASSES: Record<
  Team['color'],
  { border: string; bg: string; text: string; ring: string; badge: string; header: string }
> = {
  blue: {
    border: 'border-blue-400 dark:border-blue-700',
    bg: 'bg-blue-50/60 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500',
    badge: 'bg-blue-500 text-white',
    header: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
  },
  red: {
    border: 'border-rose-400 dark:border-rose-700',
    bg: 'bg-rose-50/60 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500',
    badge: 'bg-rose-500 text-white',
    header: 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
  },
  green: {
    border: 'border-emerald-400 dark:border-emerald-700',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-500 text-white',
    header: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
  },
  amber: {
    border: 'border-amber-400 dark:border-amber-700',
    bg: 'bg-amber-50/60 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500',
    badge: 'bg-amber-500 text-white',
    header: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
  },
  purple: {
    border: 'border-purple-400 dark:border-purple-700',
    bg: 'bg-purple-50/60 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500',
    badge: 'bg-purple-500 text-white',
    header: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
  },
  pink: {
    border: 'border-pink-400 dark:border-pink-700',
    bg: 'bg-pink-50/60 dark:bg-pink-950/30',
    text: 'text-pink-600 dark:text-pink-400',
    ring: 'ring-pink-500',
    badge: 'bg-pink-500 text-white',
    header: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
  }
};

export const TeamScoreboard: React.FC<TeamScoreboardProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  onUpdateTeam,
  onAddTeam,
  onDeleteTeam,
  onResetScores,
  onStartQuiz,
}) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState<Team['color']>('green');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const highestScore = Math.max(...teams.map((t) => t.score), 0);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onAddTeam(newTeamName.trim(), newTeamColor);
    setNewTeamName('');
    setShowAddForm(false);
  };

  const handleScoreAdjust = (team: Team, delta: number) => {
    const newScore = Math.max(0, team.score + delta);
    onUpdateTeam({ ...team, score: newScore });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏆</span> 팀 대결 스코어보드
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            청팀/백팀 또는 조별(모둠별) 대항전 점수를 실시간으로 기록하고 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> 팀 추가하기
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> 점수 초기화
          </button>

          <button
            onClick={onStartQuiz}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap"
          >
            <span>선택된 팀으로 퀴즈 시작</span>
          </button>
        </div>
      </div>

      {/* Add Team Modal / Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTeam}
          className="p-5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">새 팀 추가</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                팀 이름 (예: 1조, 2조, 번개팀 등)
              </label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="팀 이름을 입력하세요"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                팀 컬러
              </label>
              <div className="flex gap-2 py-1">
                {(['blue', 'red', 'green', 'amber', 'purple', 'pink'] as Team['color'][]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTeamColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      c === 'blue'
                        ? 'bg-blue-500'
                        : c === 'red'
                        ? 'bg-rose-500'
                        : c === 'green'
                        ? 'bg-emerald-500'
                        : c === 'amber'
                        ? 'bg-amber-500'
                        : c === 'purple'
                        ? 'bg-purple-500'
                        : 'bg-pink-500'
                    } ${newTeamColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
            >
              추가 완료
            </button>
          </div>
        </form>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => {
          const isSelected = team.id === selectedTeamId;
          const isLeading = team.score > 0 && team.score === highestScore;
          const colorStyle = COLOR_CLASSES[team.color] || COLOR_CLASSES.blue;

          return (
            <div
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className={`rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                colorStyle.border
              } ${colorStyle.bg} ${
                isSelected
                  ? `ring-4 ${colorStyle.ring} shadow-lg scale-[1.01]`
                  : 'hover:shadow-md'
              }`}
            >
              {/* Header Card Strip */}
              <div className={`p-4 flex items-center justify-between ${colorStyle.header}`}>
                <div className="flex items-center gap-2">
                  {isLeading ? (
                    <Trophy className="w-5 h-5 text-amber-200 animate-bounce" />
                  ) : (
                    <Shield className="w-5 h-5 opacity-90" />
                  )}
                  <h3 className="font-bold text-lg font-dohyeon tracking-wide">{team.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> 출전 선택됨
                    </span>
                  )}
                  {teams.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamToDelete(team);
                      }}
                      className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                      title="팀 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white/80" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Score Center */}
              <div className="p-6 text-center space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  누적 획득 점수
                </span>
                <div className="font-dohyeon text-6xl tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {team.score}
                  <span className="text-2xl font-sans font-bold ml-1 text-slate-500">점</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  진행한 라운드: <span className="font-bold">{team.roundsPlayed || 0}</span>회
                </div>
              </div>

              {/* Score Control Buttons Footer */}
              <div
                className="p-3 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleScoreAdjust(team, -1)}
                    title="1점 감점"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  >
                    -1
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleScoreAdjust(team, 1)}
                    title="1점 추가"
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    +1점
                  </button>
                  <button
                    onClick={() => handleScoreAdjust(team, 3)}
                    title="3점 보너스"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  >
                    +3점
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Confirmation Modal: Reset Scores */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto text-amber-600">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-dohyeon text-slate-900 dark:text-white">
                점수 초기화
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                모든 팀의 점수를 <strong>0점</strong>으로 리셋하시겠습니까? (팀 정보는 유지됩니다)
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetScores();
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Team */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-dohyeon text-slate-900 dark:text-white">
                팀 삭제
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <strong>'{teamToDelete.name}'</strong>을(를) 삭제하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTeam(teamToDelete.id);
                  setTeamToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
