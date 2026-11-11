import React, { useState } from 'react';
import { QuizTopic } from '../types/quiz';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  RotateCcw,
  Download,
  Upload,
  Check,
  X,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface TopicManagerProps {
  topics: QuizTopic[];
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  onSaveTopic: (topic: QuizTopic) => void;
  onDeleteTopic: (id: string) => void;
  onResetToDefaults: () => void;
  onStartQuizWithTopic: (topicId: string) => void;
}

const COMMON_EMOJIS = ['🦁', '⚽', '👮', '😂', '🏫', '🧚', '🍕', '🚀', '🎬', '🎨', '🎵', '🧩', '🌳', '🌟', '🤖'];

export const TopicManager: React.FC<TopicManagerProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onSaveTopic,
  onDeleteTopic,
  onResetToDefaults,
  onStartQuizWithTopic,
}) => {
  const [editingTopic, setEditingTopic] = useState<QuizTopic | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [singleWordInput, setSingleWordInput] = useState('');
  const [bulkWordsInput, setBulkWordsInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  const handleStartCreate = () => {
    const newTopic: QuizTopic = {
      id: 'custom-' + Date.now(),
      title: '',
      description: '',
      emoji: '⭐',
      words: [],
      isCustom: true,
      createdAt: Date.now(),
    };
    setEditingTopic(newTopic);
    setIsCreatingNew(true);
    setSingleWordInput('');
  };

  const handleStartEdit = (topic: QuizTopic) => {
    setEditingTopic({ ...topic, words: [...topic.words] });
    setIsCreatingNew(false);
    setSingleWordInput('');
  };

  const handleAddSingleWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTopic) return;
    const trimmed = singleWordInput.trim();
    if (!trimmed) return;

    if (!editingTopic.words.includes(trimmed)) {
      setEditingTopic({
        ...editingTopic,
        words: [...editingTopic.words, trimmed],
      });
    }
    setSingleWordInput('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    if (!editingTopic) return;
    setEditingTopic({
      ...editingTopic,
      words: editingTopic.words.filter((w) => w !== wordToRemove),
    });
  };

  const handleApplyBulkWords = () => {
    if (!editingTopic) return;
    // Split by newlines, commas, or slashes
    const rawWords = bulkWordsInput
      .split(/[\n,;/]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const existingSet = new Set(editingTopic.words);
    const newWords = [...editingTopic.words];

    rawWords.forEach((w) => {
      if (!existingSet.has(w)) {
        existingSet.add(w);
        newWords.push(w);
      }
    });

    setEditingTopic({
      ...editingTopic,
      words: newWords,
    });
    setBulkWordsInput('');
    setShowBulkModal(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    if (!editingTopic.title.trim()) {
      alert('주제명을 입력해 주세요.');
      return;
    }
    if (editingTopic.words.length === 0) {
      alert('최소 1개 이상의 문제를 입력해 주세요.');
      return;
    }

    onSaveTopic(editingTopic);
    onSelectTopic(editingTopic.id);
    setEditingTopic(null);
    setIsCreatingNew(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(topics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `몸으로말해요_문제세트_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].words) {
          parsed.forEach((item: QuizTopic) => onSaveTopic(item));
          alert(`${parsed.length}개의 주제를 성공적으로 불러왔습니다!`);
        } else {
          alert('올바른 문제 세트 JSON 형식이 아닙니다.');
        }
      } catch {
        alert('파일을 읽는 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredWords = activeTopic
    ? activeTopic.words.filter((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📝</span> 주제 & 제시어 문제 관리
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            행사 성격에 맞게 새로운 주제를 추가하거나 기존 문제를 마음껏 편집하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> 새 주제 만들기
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" />
            <span>불러오기</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            title="현재 문제 세트를 파일로 저장"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> 내보내기
          </button>

          <button
            onClick={() => {
              if (confirm('기본 추천 문제 세트로 초기화하시겠습니까? (직접 만든 주제는 삭제됩니다)')) {
                onResetToDefaults();
              }
            }}
            title="초기 프리셋으로 되돌리기"
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" /> 초기화
          </button>
        </div>
      </div>

      {/* Main Grid: Topic List & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topics Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              주제 목록 ({topics.length}개)
            </span>
            <span className="text-xs text-slate-500">선택하여 미리보기</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {topics.map((t) => {
              const isSelected = t.id === activeTopic.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTopic(t.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji || '📌'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {t.title}
                          </h4>
                          {t.isCustom && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              직접 만듦
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {t.description || '문제 세트'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
                        {t.words.length}문제
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Topic Details & Words (7 cols) */}
        <div className="lg:col-span-7">
          {activeTopic && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header of Active Topic */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-3xl shadow-inner">
                    {activeTopic.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-dohyeon">
                        {activeTopic.title}
                      </h3>
                      {activeTopic.isCustom && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          사용자 정의
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {activeTopic.description || '등록된 문제 세트입니다.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(activeTopic)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> 문제 수정
                  </button>

                  {activeTopic.isCustom && (
                    <button
                      onClick={() => {
                        if (confirm(`'${activeTopic.title}' 주제를 삭제하시겠습니까?`)) {
                          onDeleteTopic(activeTopic.id);
                        }
                      }}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="주제 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onStartQuizWithTopic(activeTopic.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <span>이 주제로 퀴즈 시작</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Words Header & Search */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                    출제 문제 목록
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    총 {activeTopic.words.length}개
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="단어 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
              </div>

              {/* Word Chips Display */}
              <div className="min-h-[280px] max-h-[420px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-2.5 content-start">
                {filteredWords.length > 0 ? (
                  filteredWords.map((word, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold shadow-xs flex items-center gap-2 group"
                    >
                      <span className="text-slate-400 text-xs font-mono">{idx + 1}</span>
                      <span>{word}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({word.replace(/\s+/g, '').length}자)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-48 flex flex-col items-center justify-center text-slate-400">
                    <p className="text-sm">검색된 문제가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Edit or Create Topic */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-dohyeon">
                {isCreatingNew ? '✨ 새로운 퀴즈 주제 만들기' : '✏️ 퀴즈 주제 및 문제 수정'}
              </h3>
              <button
                onClick={() => setEditingTopic(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Topic Name & Emoji */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    주제명 (카테고리) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTopic.title}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                    placeholder="예: 우리 학교 선생님들, 전래 동화, 가요 안무 등"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    아이콘 이모지
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={editingTopic.emoji}
                      onChange={(e) => setEditingTopic({ ...editingTopic, emoji: e.target.value || '⭐' })}
                      className="w-14 px-3 py-2 text-center text-xl rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <div className="flex gap-1 overflow-x-auto max-w-[120px] py-1">
                      {COMMON_EMOJIS.slice(0, 4).map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEditingTopic({ ...editingTopic, emoji: em })}
                          className="hover:scale-125 transition-transform"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  주제 설명 (진행자 안내용)
                </label>
                <input
                  type="text"
                  value={editingTopic.description}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  placeholder="예: 학생들이 몸짓으로 설명하기 좋은 직업 퀴즈"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Word Input Area */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      문제 제시어 목록 ({editingTopic.words.length}개 등록됨)
                    </span>
                    <p className="text-xs text-slate-500">한 단어씩 넣거나, 일괄 붙여넣기로 한 번에 등록하세요.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>한 번에 대량 입력</span>
                  </button>
                </div>

                {/* Single Word Input Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={singleWordInput}
                    onChange={(e) => setSingleWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleWord();
                      }
                    }}
                    placeholder="제시어 단어 입력 (예: 코끼리, 양치질하기) 후 엔터"
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSingleWord()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
                  >
                    추가
                  </button>
                </div>

                {/* Word List Chips with delete */}
                <div className="min-h-[160px] max-h-[220px] overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 content-start">
                  {editingTopic.words.length > 0 ? (
                    editingTopic.words.map((word, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <span>{word}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWord(word)}
                          className="text-slate-400 hover:text-rose-600 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center text-xs text-slate-400">
                      아직 등록된 문제가 없습니다. 위 입력창에서 문제를 추가해 주세요.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>저장 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Bulk Words Paste */}
      {showBulkModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>단어 대량 붙여넣기</span>
              </h4>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              한글 문서, 엑셀, 카카오톡 등에서 복사한 단어 목록을 붙여넣으세요. 줄바꿈(엔터)이나 쉼표(,)로 구분된 단어들이 자동으로 등록됩니다.
            </p>

            <textarea
              rows={8}
              value={bulkWordsInput}
              onChange={(e) => setBulkWordsInput(e.target.value)}
              placeholder={`예시:
호랑이
코끼리
기린
펭귄, 판다, 캥거루`}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                인식된 단어 수: ~
                {
                  bulkWordsInput
                    .split(/[\n,;/]+/)
                    .map((s) => s.trim())
                    .filter(Boolean).length
                }
                개
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkWords}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  단어 일괄 추가하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
