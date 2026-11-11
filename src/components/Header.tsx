import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, HelpCircle, Moon, Sun, Cloud, CloudOff } from 'lucide-react';

interface HeaderProps {
  currentTab: 'play' | 'topics' | 'teams';
  onSelectTab: (tab: 'play' | 'topics' | 'teams') => void;
  isGameRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  stageMode: 'light' | 'stageDark';
  onToggleStageMode: () => void;
  onOpenHelp: () => void;
  cloudStatus: 'connected' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isGameRunning,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  stageMode,
  onToggleStageMode,
  onOpenHelp,
  cloudStatus,
}) => {
  const isDark = stageMode === 'stageDark';

  return (
    <header
      className={`shrink-0 border-b transition-colors duration-200 select-none ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-sm font-dohyeon text-xl">
            몸
          </div>
          <div className="flex flex-col">
            <span className="font-dohyeon text-xl tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
              몸으로 말해요
              <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                초등 행사 퀴즈
              </span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (hidden during active gameplay to avoid accidental clicks) */}
        {!isGameRunning ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('play')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                currentTab === 'play'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              🎮 퀴즈 시작
            </button>
            <button
              onClick={() => onSelectTab('topics')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                currentTab === 'topics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              📝 주제 & 문제 관리
            </button>
            <button
              onClick={() => onSelectTab('teams')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                currentTab === 'teams'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              🏆 팀 스코어보드
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            퀴즈가 진행 중입니다
          </div>
        )}

        {/* Zone 3: Functional Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud DB Connection Status */}
          {cloudStatus === 'connected' ? (
            <span
              title="클라우드 데이터베이스(Firebase)에 실시간 자동 저장됩니다."
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>DB 동기화 중</span>
            </span>
          ) : cloudStatus === 'syncing' ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg animate-pulse">
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span>동기화 연결 중</span>
            </span>
          ) : (
            <span
              title="오프라인 로컬 저장 모드로 동작 중입니다."
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"
            >
              <CloudOff className="w-3 h-3 text-slate-400" />
              <span>로컬 모드</span>
            </span>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Projector Stage Dark Mode */}
          <button
            onClick={onToggleStageMode}
            title={isDark ? '일반 모드로 전환' : '강당/프로젝터 다크 모드 전환'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면 모드 (빔프로젝터용)'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Help Instructions */}
          <button
            onClick={onOpenHelp}
            title="게임 진행 가이드"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">진행 가이드</span>
          </button>
        </div>
      </div>
    </header>
  );
};
