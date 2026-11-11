/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QuizTopic, Team, GameSettings, RoundSummary } from './types/quiz';
import { PRESET_TOPICS, INITIAL_TEAMS } from './data/presets';
import { Header } from './components/Header';
import { PlayScreen } from './components/PlayScreen';
import { TopicManager } from './components/TopicManager';
import { TeamScoreboard } from './components/TeamScoreboard';
import { RoundResult } from './components/RoundResult';
import { InstructionsModal } from './components/InstructionsModal';
import { sound } from './utils/audio';

const STORAGE_KEYS = {
  TOPICS: 'charades_quiz_topics_v1',
  TEAMS: 'charades_quiz_teams_v1',
  SETTINGS: 'charades_quiz_settings_v1',
  STAGE_MODE: 'charades_quiz_stage_mode_v1',
};

const DEFAULT_SETTINGS: GameSettings = {
  timeLimit: 60,
  passLimit: 0, // unlimited
  shuffle: true,
  fontSize: 'large',
  showWordLength: true,
  showCategory: true,
  soundEnabled: true,
  stageMode: 'light',
};

export default function App() {
  // 1. Persistent State Initialization
  const [topics, setTopics] = useState<QuizTopic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return PRESET_TOPICS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TEAMS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [stageMode, setStageMode] = useState<'light' | 'stageDark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAGE_MODE);
      if (saved === 'stageDark' || saved === 'light') return saved;
    } catch {
      // fallback
    }
    return 'light';
  });

  // 2. Active Tab & Selections
  const [currentTab, setCurrentTab] = useState<'play' | 'topics' | 'teams'>('play');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => topics[0]?.id || 'preset-animals');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => teams[0]?.id || 'team-blue');

  // 3. Runtime States
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
    } catch {}
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAGE_MODE, stageMode);
    } catch {}

    // Apply dark class to document root for Tailwind dark variants
    if (stageMode === 'stageDark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [stageMode]);

  // Sync sound setting
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Sync Fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handlers
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleToggleStageMode = () => {
    setStageMode((prev) => (prev === 'light' ? 'stageDark' : 'light'));
  };

  const handleToggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Topic Handlers
  const handleSaveTopic = (topic: QuizTopic) => {
    setTopics((prev) => {
      const idx = prev.findIndex((t) => t.id === topic.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = topic;
        return updated;
      }
      return [topic, ...prev];
    });
  };

  const handleDeleteTopic = (id: string) => {
    setTopics((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (selectedTopicId === id && filtered.length > 0) {
        setSelectedTopicId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleResetToDefaults = () => {
    setTopics(PRESET_TOPICS);
    setSelectedTopicId(PRESET_TOPICS[0].id);
  };

  // Team Handlers
  const handleUpdateTeam = (updated: Team) => {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAddTeam = (name: string, color: Team['color']) => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      color,
      score: 0,
      roundsPlayed: 0,
    };
    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (selectedTeamId === id && filtered.length > 0) {
        setSelectedTeamId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleResetScores = () => {
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0, roundsPlayed: 0 })));
  };

  // Round Completion
  const handleRoundComplete = (summary: RoundSummary) => {
    // Automatically update team score and rounds played
    if (summary.teamId) {
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === summary.teamId) {
            return {
              ...t,
              score: t.score + summary.correctWords.length,
              roundsPlayed: t.roundsPlayed + 1,
            };
          }
          return t;
        })
      );
    }
    setRoundSummary(summary);
  };

  // Quick action from Topic / Scoreboard to start quiz
  const handleStartQuizWithTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setCurrentTab('play');
  };

  // Advance to next team for round-robin
  const handleNextTeamPrepare = () => {
    const currentIndex = teams.findIndex((t) => t.id === selectedTeamId);
    const nextIndex = (currentIndex + 1) % teams.length;
    setSelectedTeamId(teams[nextIndex].id);
    setRoundSummary(null);
    setCurrentTab('play');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        stageMode === 'stageDark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'
      }`}
    >
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isGameRunning={isGameRunning}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        stageMode={stageMode}
        onToggleStageMode={handleToggleStageMode}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'play' && (
          <PlayScreen
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopicId={setSelectedTopicId}
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeamId={setSelectedTeamId}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRoundComplete={handleRoundComplete}
            onGameRunningChange={setIsGameRunning}
            stageMode={stageMode}
          />
        )}

        {currentTab === 'topics' && (
          <TopicManager
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            onSaveTopic={handleSaveTopic}
            onDeleteTopic={handleDeleteTopic}
            onResetToDefaults={handleResetToDefaults}
            onStartQuizWithTopic={handleStartQuizWithTopic}
          />
        )}

        {currentTab === 'teams' && (
          <TeamScoreboard
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            onUpdateTeam={handleUpdateTeam}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onResetScores={handleResetScores}
            onStartQuiz={() => setCurrentTab('play')}
          />
        )}
      </main>

      {/* Round Result Modal */}
      {roundSummary && (
        <RoundResult
          summary={roundSummary}
          onPlayAgain={() => setRoundSummary(null)}
          onNextTeam={handleNextTeamPrepare}
          onClose={() => setRoundSummary(null)}
        />
      )}

      {/* Instructions / Help Modal */}
      {showHelp && <InstructionsModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
