import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QuizTopic,
  Team,
  GameSettings,
  GameWordResult,
  RoundSummary,
  FontSizeOption
} from '../types/quiz';
import {
  Play,
  RotateCcw,
  CheckCircle,
  SkipForward,
  Pause,
  Clock,
  Shuffle,
  Volume2,
  VolumeX,
  Undo2,
  Square,
  AlertTriangle,
  Flame,
  Settings2,
  Award
} from 'lucide-react';
import { sound } from '../utils/audio';

interface PlayScreenProps {
  topics: QuizTopic[];
  selectedTopicId: string;
  onSelectTopicId: (id: string) => void;
  teams: Team[];
  selectedTeamId: string;
  onSelectTeamId: (id: string) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onRoundComplete: (summary: RoundSummary) => void;
  onGameRunningChange: (isRunning: boolean) => void;
  stageMode: 'light' | 'stageDark';
}

type PlayStatus = 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED';

export const PlayScreen: React.FC<PlayScreenProps> = ({
  topics,
  selectedTopicId,
  onSelectTopicId,
  teams,
  selectedTeamId,
  onSelectTeamId,
  settings,
  onUpdateSettings,
  onRoundComplete,
  onGameRunningChange,
  stageMode,
}) => {
  const [playStatus, setPlayStatus] = useState<PlayStatus>('LOBBY');
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit || 60);
  const [activeWords, setActiveWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [history, setHistory] = useState<GameWordResult[]>([]);
  const [flashType, setFlashType] = useState<'correct' | 'passed' | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const timerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync running state with parent for header lock
  useEffect(() => {
    onGameRunningChange(playStatus === 'COUNTDOWN' || playStatus === 'PLAYING' || playStatus === 'PAUSED');
  }, [playStatus, onGameRunningChange]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Prepare deck of words
  const prepareGameWords = useCallback(() => {
    if (!activeTopic || activeTopic.words.length === 0) return [];
    let list = [...activeTopic.words];
    if (settings.shuffle) {
      // Fisher-Yates shuffle
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [activeTopic, settings.shuffle]);

  // Start the 3.. 2.. 1.. Countdown
  const handleStartGame = () => {
    const words = prepareGameWords();
    if (words.length === 0) {
      setLobbyError('출제할 문제가 없습니다. 주제 관리에서 문제를 먼저 등록해 주세요.');
      return;
    }
    setLobbyError(null);

    setActiveWords(words);
    setCurrentIndex(0);
    setHistory([]);
    setCountdown(3);
    setPlayStatus('COUNTDOWN');
    setTimeLeft(settings.timeLimit);

    sound.playTick();

    let count = 3;
    countdownTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else {
        clearInterval(countdownTimerRef.current!);
        setCountdown(0);
        sound.playStart();
        startGameLoop();
      }
    }, 900);
  };

  // Main Game Loop Timer
  const startGameLoop = () => {
    setPlayStatus('PLAYING');
    startTimeRef.current = Date.now();

    if (settings.timeLimit > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleEndGame();
            return 0;
          }
          if (prev <= 6 && prev > 1) {
            sound.playTick(true); // urgent ticking
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Pause & Resume
  const handleTogglePause = () => {
    if (playStatus === 'PLAYING') {
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayStatus('PAUSED');
    } else if (playStatus === 'PAUSED') {
      setPlayStatus('PLAYING');
      if (settings.timeLimit > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleEndGame();
              return 0;
            }
            if (prev <= 6 && prev > 1) {
              sound.playTick(true);
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  // Finish / End Game
  const handleEndGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    sound.playTimeUp();

    const correctWords = history.filter((h) => h.status === 'correct').map((h) => h.word);
    const passedWords = history.filter((h) => h.status === 'passed').map((h) => h.word);
    const remainingWords = activeWords.slice(currentIndex);

    const totalDuration = settings.timeLimit > 0 ? settings.timeLimit : 60;
    const timeSpent = settings.timeLimit > 0 ? settings.timeLimit - timeLeft : Math.floor((Date.now() - startTimeRef.current) / 1000);

    const summary: RoundSummary = {
      topicTitle: activeTopic.title,
      topicEmoji: activeTopic.emoji,
      teamId: activeTeam?.id,
      teamName: activeTeam?.name,
      teamColor: activeTeam?.color,
      correctWords,
      passedWords,
      remainingWords,
      totalTime: totalDuration,
      timeSpent: Math.max(1, timeSpent),
      date: Date.now(),
    };

    setPlayStatus('LOBBY');
    onRoundComplete(summary);
  }, [history, activeWords, currentIndex, settings.timeLimit, timeLeft, activeTopic, activeTeam, onRoundComplete]);

  // Flash feedback on action
  const triggerFlash = (type: 'correct' | 'passed') => {
    setFlashType(type);
    setTimeout(() => {
      setFlashType(null);
    }, 300);
  };

  // Action: Correct Answer
  const handleCorrect = useCallback(() => {
    if (playStatus !== 'PLAYING' || currentIndex >= activeWords.length) return;

    sound.playCorrect();
    triggerFlash('correct');

    const currentWord = activeWords[currentIndex];
    const newHistory: GameWordResult[] = [
      ...history,
      { word: currentWord, status: 'correct', timestamp: Date.now() },
    ];
    setHistory(newHistory);

    if (currentIndex + 1 >= activeWords.length) {
      // Finished all available words!
      handleEndGame();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [playStatus, currentIndex, activeWords, history, handleEndGame]);

  // Action: Pass Word
  const handlePass = useCallback(() => {
    if (playStatus !== 'PLAYING' || currentIndex >= activeWords.length) return;

    // Check pass limit if set
    const currentPasses = history.filter((h) => h.status === 'passed').length;
    if (settings.passLimit > 0 && currentPasses >= settings.passLimit) {
      return;
    }

    sound.playPass();
    triggerFlash('passed');

    const currentWord = activeWords[currentIndex];
    const newHistory: GameWordResult[] = [
      ...history,
      { word: currentWord, status: 'passed', timestamp: Date.now() },
    ];
    setHistory(newHistory);

    if (currentIndex + 1 >= activeWords.length) {
      handleEndGame();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [playStatus, currentIndex, activeWords, history, settings.passLimit, handleEndGame]);

  // Action: Undo last action (e.g. host accidentally clicked pass instead of correct)
  const handleUndo = useCallback(() => {
    if (playStatus !== 'PLAYING' || history.length === 0 || currentIndex === 0) return;

    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
  }, [playStatus, history.length, currentIndex]);

  // Keyboard shortcut listener for seamless MC operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playStatus !== 'PLAYING' && playStatus !== 'PAUSED') return;

      // Avoid triggering when focused on input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (playStatus === 'PLAYING') handleCorrect();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (playStatus === 'PLAYING') handlePass();
      } else if (e.code === 'Backspace' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (playStatus === 'PLAYING') handleUndo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playStatus, handleCorrect, handlePass, handleUndo]);

  const correctCount = history.filter((h) => h.status === 'correct').length;
  const passCount = history.filter((h) => h.status === 'passed').length;
  const currentWord = activeWords[currentIndex] || '';

  // Dynamic responsive font size scaling so ANY word fills the entire screen
  const getDynamicWordClasses = (word: string, sizePref: FontSizeOption) => {
    const len = word.replace(/\s+/g, '').length || 1;

    if (sizePref === 'huge') {
      if (len <= 2) return 'text-[clamp(6rem,22vw,22rem)]';
      if (len <= 3) return 'text-[clamp(5rem,18vw,18rem)]';
      if (len <= 4) return 'text-[clamp(4.2rem,14.5vw,14.5rem)]';
      if (len <= 6) return 'text-[clamp(3.5rem,11vw,11rem)]';
      return 'text-[clamp(2.5rem,8vw,8rem)]';
    } else if (sizePref === 'large') {
      if (len <= 2) return 'text-[clamp(5rem,19vw,19rem)]';
      if (len <= 3) return 'text-[clamp(4.2rem,15.5vw,15.5rem)]';
      if (len <= 4) return 'text-[clamp(3.5rem,12.5vw,12.5rem)]';
      if (len <= 6) return 'text-[clamp(3rem,9.5vw,9.5rem)]';
      return 'text-[clamp(2.2rem,7vw,7rem)]';
    } else {
      if (len <= 2) return 'text-[clamp(4rem,15vw,15rem)]';
      if (len <= 3) return 'text-[clamp(3.5rem,12vw,12rem)]';
      if (len <= 4) return 'text-[clamp(3rem,10vw,10rem)]';
      if (len <= 6) return 'text-[clamp(2.5rem,7.5vw,7.5rem)]';
      return 'text-[clamp(2rem,5.5vw,5.5rem)]';
    }
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
    }
    return `${secs}초`;
  };

  const isDark = stageMode === 'stageDark';

  // -------------------------------------------------------------
  // VIEW 1: LOBBY & PRE-GAME SETUP
  // -------------------------------------------------------------
  if (playStatus === 'LOBBY') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Main Hero Card for Starting Quiz */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>초등학교 스피드 퀴즈 준비 완료</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-dohyeon tracking-wide text-white leading-tight">
                준비되셨나요? <br />
                <span className="text-amber-300">몸으로 말해요</span> 출전!
              </h1>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                출제자는 말을 하지 않고 오직 몸짓으로 설명합니다! 대형 화면으로 시원하게 문제를 띄워보세요.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={handleStartGame}
                className="w-full md:w-auto px-8 py-5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-dohyeon text-2xl tracking-wide rounded-2xl shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Play className="w-7 h-7 fill-current group-hover:scale-110 transition-transform" />
                <span>게임 시작하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Section (Topic & Team Selection + Settings) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Topic Selection */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                01. 퀴즈 주제 선택
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                현재: {activeTopic?.title} ({activeTopic?.words.length}문제)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {topics.map((t) => {
                const isSelected = t.id === selectedTopicId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTopicId(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-blue-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{t.emoji || '📌'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate text-slate-900 dark:text-white">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.words.length}단어
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Playing Team Selection */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                02. 출전 팀 선택
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                도전 팀: {activeTeam?.name} (현재 {activeTeam?.score}점)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {teams.map((t) => {
                const isSelected = t.id === selectedTeamId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTeamId(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        누적 {t.score}점
                      </div>
                    </div>
                    <span className="text-lg">🎯</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Game Rule & Display Options */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              게임 환경 & 라운드 옵션
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Option 1: Time Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                ⏱️ 제한 시간
              </label>
              <select
                value={settings.timeLimit}
                onChange={(e) => onUpdateSettings({ timeLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30초 (스피드 초단기전)</option>
                <option value={45}>45초</option>
                <option value={60}>60초 (1분 · 표준 추천 ⭐️)</option>
                <option value={90}>90초 (1분 30초)</option>
                <option value={120}>120초 (2분)</option>
                <option value={180}>180초 (3분 · 넉넉한 진행)</option>
                <option value={0}>무제한 (시간 제한 없음)</option>
              </select>
            </div>

            {/* Option 2: Pass Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                ✋ 패스(Pass) 허용 횟수
              </label>
              <select
                value={settings.passLimit}
                onChange={(e) => onUpdateSettings({ passLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>무제한 패스 가능 (기본)</option>
                <option value={1}>최대 1회 패스</option>
                <option value={2}>최대 2회 패스</option>
                <option value={3}>최대 3회 패스</option>
                <option value={5}>최대 5회 패스</option>
              </select>
            </div>

            {/* Option 3: Font Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                🔤 글자 크기 (화면 거리 맞춤)
              </label>
              <select
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: e.target.value as FontSizeOption })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">보통 크기 (TV 모니터)</option>
                <option value="large">크게 (교실 빔프로젝터 ⭐️)</option>
                <option value="huge">초대형 (강당 대형 스크린)</option>
              </select>
            </div>

            {/* Option 4: Shuffle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                🔀 문제 출제 순서
              </label>
              <button
                type="button"
                onClick={() => onUpdateSettings({ shuffle: !settings.shuffle })}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  settings.shuffle
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                <span>{settings.shuffle ? '무작위 셔플 (ON)' : '등록 순서대로 (OFF)'}</span>
              </button>
            </div>
          </div>

          {/* Toggle Switches for Length & Category Hints */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.showWordLength}
                onChange={(e) => onUpdateSettings({ showWordLength: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>글자 수 힌트 표시 (예: [3글자])</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.showCategory}
                onChange={(e) => onUpdateSettings({ showCategory: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>화면에 주제명(카테고리) 표시</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: 3.. 2.. 1.. COUNTDOWN OVERLAY
  // -------------------------------------------------------------
  if (playStatus === 'COUNTDOWN') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white select-none">
        <div className="text-center space-y-6 animate-in zoom-in-75 duration-200">
          <div className="text-2xl sm:text-3xl font-dohyeon text-amber-400 tracking-wider">
            {activeTeam?.name} 차례! 준비하세요!
          </div>

          <div className="text-9xl sm:text-[14rem] font-dohyeon tracking-tight text-white animate-bounce leading-none drop-shadow-2xl">
            {countdown > 0 ? countdown : '출발! 🚀'}
          </div>

          <p className="text-slate-400 text-base font-medium">
            주제: <strong className="text-white">{activeTopic?.title}</strong>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: ACTIVE PLAY / PAUSED SCREEN (THE ARENA)
  // -------------------------------------------------------------
  const timeProgressPercent = settings.timeLimit > 0 ? (timeLeft / settings.timeLimit) * 100 : 100;
  const isTimeUrgent = settings.timeLimit > 0 && timeLeft <= 10;

  return (
    <div
      className={`relative flex-1 w-full min-h-[calc(100vh-6.5rem)] flex flex-col justify-between rounded-3xl p-3 sm:p-5 transition-colors select-none ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'
      } ${
        flashType === 'correct'
          ? 'ring-8 ring-emerald-500/80 bg-emerald-950/20'
          : flashType === 'passed'
          ? 'ring-8 ring-amber-500/80 bg-amber-950/20'
          : ''
      }`}
    >
      {/* Visual Flash Banner overlay */}
      {flashType === 'correct' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="px-8 py-4 rounded-3xl bg-emerald-600 text-white font-dohyeon text-4xl sm:text-5xl shadow-2xl animate-in zoom-in-90 fade-out duration-300">
            딩동댕! 정답! +1점 👏
          </div>
        </div>
      )}
      {flashType === 'passed' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="px-8 py-4 rounded-3xl bg-amber-600 text-white font-dohyeon text-4xl sm:text-5xl shadow-2xl animate-in zoom-in-90 fade-out duration-300">
            패스! 다음 문제 ⏩
          </div>
        </div>
      )}

      {/* Top HUD Strip: Compact, High-contrast */}
      <div className="flex items-center justify-between gap-3 px-2 pb-3 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0">
        {/* Left: Active Team & Topic */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm">
            <span>🎯</span>
            <span className="font-dohyeon text-sm sm:text-base tracking-wide">{activeTeam?.name}</span>
          </div>
          {settings.showCategory && (
            <div className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>{activeTopic.emoji}</span>
              <span>{activeTopic.title}</span>
            </div>
          )}
        </div>

        {/* Center: Timer Clock */}
        <div className="flex items-center justify-center">
          {settings.timeLimit > 0 ? (
            <div
              className={`flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border font-dohyeon text-2xl sm:text-3xl tabular-nums shadow-sm transition-all ${
                isTimeUrgent
                  ? 'border-rose-500 bg-rose-500 text-white animate-pulse shadow-rose-500/50'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              }`}
            >
              <Clock className={`w-5 h-5 ${isTimeUrgent ? 'animate-spin' : 'text-blue-500'}`} />
              <span>{formatTimerDisplay(timeLeft)}</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>무제한</span>
            </div>
          )}
        </div>

        {/* Right: Score Counter & Pause */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              정답 {correctCount}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              패스 {passCount}
              {settings.passLimit > 0 && `/${settings.passLimit}`}
            </span>
          </div>

          <button
            onClick={handleTogglePause}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="일시정지 (Esc)"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage: Giant Screen-Filling Word Arena */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-auto px-2 sm:px-6 relative overflow-hidden py-4">
        {/* Ambient Stage Glow */}
        <div
          className={`absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 ${
            isDark
              ? 'bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18),transparent_70%)]'
              : 'bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)]'
          }`}
        />

        {/* Context metadata pills */}
        <div className="flex items-center gap-2 mb-2 z-10 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80">
            문제 {currentIndex + 1} / {activeWords.length}
          </span>
          {settings.showWordLength && currentWord && (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
              {currentWord.replace(/\s+/g, '').length}글자
            </span>
          )}
        </div>

        {/* Massive Screen-Filling Word */}
        <div className="w-full flex-1 flex items-center justify-center text-center z-10 px-2 py-4 sm:py-8">
          <h2
            className={`font-dohyeon font-bold transition-all leading-none select-none tracking-tight break-keep text-balance ${getDynamicWordClasses(
              currentWord,
              settings.fontSize
            )} ${
              isDark
                ? 'text-white drop-shadow-[0_12px_45px_rgba(255,255,255,0.3)]'
                : 'text-slate-900 drop-shadow-[0_6px_25px_rgba(0,0,0,0.16)]'
            }`}
          >
            {currentWord || '모든 문제 완료!'}
          </h2>
        </div>
      </div>

      {/* Bottom Stage Controls: Compact Dock */}
      <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Correct Button */}
          <button
            onClick={handleCorrect}
            disabled={playStatus === 'PAUSED'}
            className="sm:col-span-2 py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-98 text-white font-dohyeon text-xl sm:text-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            <span>정답! 맞힘 (Space)</span>
          </button>

          {/* 2. Pass Button */}
          <button
            onClick={handlePass}
            disabled={
              playStatus === 'PAUSED' ||
              (settings.passLimit > 0 && passCount >= settings.passLimit)
            }
            className="py-3.5 sm:py-4 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 disabled:opacity-50 text-white font-dohyeon text-lg sm:text-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            <span>패스 (P)</span>
          </button>

          {/* 3. Utility Actions Group */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex-1 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all"
              title="이전 단어로 되돌리기 (Backspace)"
            >
              <Undo2 className="w-4 h-4" />
              <span>되돌리기</span>
            </button>

            <button
              onClick={() => setShowExitModal(true)}
              className="py-3 px-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
              title="라운드 종료"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>종료</span>
            </button>
          </div>
        </div>

        {/* MC Shortcut Helper Strip */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
          단축키: <strong className="text-slate-600 dark:text-slate-300">Space/Enter</strong> 정답 |{' '}
          <strong className="text-slate-600 dark:text-slate-300">P</strong> 패스 |{' '}
          <strong className="text-slate-600 dark:text-slate-300">Backspace</strong> 되돌리기 |{' '}
          <strong className="text-slate-600 dark:text-slate-300">Esc</strong> 일시정지
        </div>
      </div>

      {/* Paused Overlay */}
      {playStatus === 'PAUSED' && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-white p-6 space-y-6">
          <div className="text-3xl font-dohyeon text-amber-400">일시정지 중 ⏸️</div>
          <p className="text-sm text-slate-300">진행을 멈추었습니다. 준비되면 계속하기를 누르세요.</p>
          <div className="flex gap-4">
            <button
              onClick={handleTogglePause}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base shadow-lg"
            >
              계속하기 (Esc)
            </button>
            <button
              onClick={() => {
                setPlayStatus('LOBBY');
                handleEndGame();
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-base shadow-lg"
            >
              라운드 종료하기
            </button>
          </div>
        </div>
      )}

      {/* In-App Exit Confirmation Modal (Replaces blocked window.confirm) */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center mx-auto text-rose-600">
              <Square className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-dohyeon text-slate-900 dark:text-white">
                퀴즈를 종료하시겠습니까?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                현재까지 맞힌 <strong className="text-emerald-600">{correctCount}문제</strong>의 점수가 기록되고 라운드가 마무리됩니다.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                계속 풀기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  handleEndGame();
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                지금 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
