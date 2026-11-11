import React from 'react';
import { X, HelpCircle, Keyboard, Lightbulb, Users, Monitor } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-dohyeon text-slate-900 dark:text-white">
                몸으로 말해요 퀴즈 진행 가이드
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                초등학교 강당 행사 및 학급 레크리에이션 꿀팁
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
          {/* Rules */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>기본 퀴즈 룰</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 dark:text-amber-300">
              <li>
                <strong>소리 금지</strong>: 출제자는 절대 말이나 소리를 내면 안 되며, 오직
                몸짓과 얼굴 표정으로만 설명해야 합니다.
              </li>
              <li>
                <strong>사물 가리키기 금지</strong>: 주변 물건을 손가락으로 직접 가리키거나
                글씨를 허공에 쓰는 행위는 반칙입니다.
              </li>
              <li>
                <strong>맞히면 즉시 다음 문제</strong>: 같은 팀 친구들이 정답을 외치면
                진행자가 [정답] 버튼을 누릅니다.
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-blue-500" />
              <span>진행자 키보드 단축키 (노트북 조작 시 강력 추천!)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium">정답 처리 (맞힘)</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold font-mono">
                  Space / Enter / →
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium">문제 패스 (넘기기)</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold font-mono">
                  P / ↓
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium">실수 취소 (이전 복구)</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold font-mono">
                  Backspace / ←
                </kbd>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium">일시정지 / 계속</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold font-mono">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Projector Tips */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-500" />
              <span>대형 스크린 / 빔프로젝터 연결 시</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              상단 우측의 <strong>전체화면 아이콘</strong>을 누르면 브라우저 창 없이 무대용 전면
              화면으로 전환됩니다. 강당의 조명을 어둡게 한 경우 <strong>달 모양 아이콘</strong>을
              눌러 [강당 무대 다크 모드]를 켜시면 눈부심 없이 글씨가 더욱 선명하게 돋보입니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
