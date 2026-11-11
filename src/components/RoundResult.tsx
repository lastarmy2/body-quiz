import React, { useEffect } from 'react';
import { RoundSummary } from '../types/quiz';
import { CheckCircle2, AlertCircle, Trophy, RotateCcw, ArrowRight, X } from 'lucide-react';
import { fireConfetti } from '../utils/confetti';
import { sound } from '../utils/audio';

interface RoundResultProps {
  summary: RoundSummary;
  onPlayAgain: () => void;
  onNextTeam: () => void;
  onClose: () => void;
}

export const RoundResult: React.FC<RoundResultProps> = ({
  summary,
  onPlayAgain,
  onNextTeam,
  onClose,
}) => {
  useEffect(() => {
    if (summary.correctWords.length > 0) {
      fireConfetti();
      sound.playFanfare();
    }
  }, [summary.correctWords.length]);

  const totalAttempted = summary.correctWords.length + summary.passedWords.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
              <Trophy className="w-8 h-8 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                  라운드 종료
                </span>
                {summary.teamName && (
                  <span className="text-xs font-bold bg-black/20 px-2 py-0.5 rounded-full">
                    도전: {summary.teamName}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold font-dohyeon mt-1 tracking-wide">
                {summary.correctWords.length}문제 맞힘! 🎉
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Stat Pill Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">정답 개수</div>
              <div className="text-3xl font-bold font-dohyeon text-emerald-600 dark:text-emerald-300 mt-0.5">
                {summary.correctWords.length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400">패스 개수</div>
              <div className="text-3xl font-bold font-dohyeon text-amber-600 dark:text-amber-300 mt-0.5">
                {summary.passedWords.length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">도전 시간</div>
              <div className="text-3xl font-bold font-dohyeon text-slate-700 dark:text-slate-200 mt-0.5">
                {Math.floor(summary.timeSpent / 60) > 0 ? (
                  <>
                    <span>{Math.floor(summary.timeSpent / 60)}</span>
                    <span className="text-base font-sans font-normal ml-0.5 mr-1.5">분</span>
                    {summary.timeSpent % 60 > 0 && (
                      <>
                        <span>{summary.timeSpent % 60}</span>
                        <span className="text-base font-sans font-normal ml-0.5">초</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>{summary.timeSpent}</span>
                    <span className="text-base font-sans font-normal ml-0.5">초</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Correct Words List */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                멋지게 성공한 단어 ({summary.correctWords.length}개)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {summary.correctWords.length > 0 ? (
                summary.correctWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold text-sm"
                  >
                    <span>✓</span> {word}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 p-2">맞힌 단어가 없습니다.</span>
              )}
            </div>
          </div>

          {/* Passed Words List */}
          {summary.passedWords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  아쉽게 패스한 단어 ({summary.passedWords.length}개)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {summary.passedWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-medium text-sm"
                  >
                    <span>P</span> {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" /> 다시 도전하기
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl"
            >
              닫기
            </button>
            <button
              onClick={onNextTeam}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <span>다음 팀 준비</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
