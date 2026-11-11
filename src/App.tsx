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
import {
  subscribeToTopics,
  saveTopicFirestore,
  deleteTopicFirestore,
  seedTopicsIfEmpty,
  subscribeToTeams,
  saveTeamFirestore,
  deleteTeamFirestore,
  resetTeamsScoresFirestore,
  seedTeamsIfEmpty,
  saveGameResultFirestore,
} from './lib/firebase';

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
  // 1. Initial State with Instant Cache
  const [topics, setTopics] = useState<QuizTopic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_TOPICS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEAMS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [stageMode, setStageMode] = useState<'light' | 'stageDark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAGE_MODE);
      if (saved === 'stageDark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  // 2. Active Tab & Selections
  const [currentTab, setCurrentTab] = useState<'play' | 'topics' | 'teams'>('play');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => topics[0]?.id || 'preset-animals');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => teams[0]?.id || 'team-blue');

  // 3. Cloud Database Connection Status
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // 4. Runtime UI States
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);

  // Firestore Database Real-time Synchronization
  useEffect(() => {
    // 1. Seed initial data to cloud if collection is new
    seedTopicsIfEmpty(PRESET_TOPICS);
    seedTeamsIfEmpty(INITIAL_TEAMS);

    // 2. Listen to real-time Topics
    const unsubscribeTopics = subscribeToTopics(
      (firestoreTopics) => {
        if (firestoreTopics && firestoreTopics.length > 0) {
          setTopics(firestoreTopics);
          setCloudStatus('connected');
          // If active topic was removed, fallback
          setSelectedTopicId((prevId) => {
            const exists = firestoreTopics.some((t) => t.id === prevId);
            return exists ? prevId : firestoreTopics[0].id;
          });
        }
      },
      () => {
        setCloudStatus('offline');
      }
    );

    // 3. Listen to real-time Teams
    const unsubscribeTeams = subscribeToTeams(
      (firestoreTeams) => {
        if (firestoreTeams && firestoreTeams.length > 0) {
          setTeams(firestoreTeams);
          setCloudStatus('connected');
          setSelectedTeamId((prevId) => {
            const exists = firestoreTeams.some((t) => t.id === prevId);
            return exists ? prevId : firestoreTeams[0].id;
          });
        }
      },
      () => {
        setCloudStatus('offline');
      }
    );

    return () => {
      unsubscribeTopics();
      unsubscribeTeams();
    };
  }, []);

  // Sync state to local storage cache for instant offline responsiveness
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

  // Topic Handlers (Optimistic update + Firestore sync)
  const handleSaveTopic = async (topic: QuizTopic) => {
    // 1. Optimistic UI update
    setTopics((prev) => {
      const idx = prev.findIndex((t) => t.id === topic.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = topic;
        return updated;
      }
      return [topic, ...prev];
    });

    // 2. Cloud Firestore persist
    try {
      await saveTopicFirestore(topic);
    } catch (err) {
      console.warn('Firestore topic save fallback to local:', err);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    setTopics((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (selectedTopicId === id && filtered.length > 0) {
        setSelectedTopicId(filtered[0].id);
      }
      return filtered;
    });

    try {
      await deleteTopicFirestore(id);
    } catch (err) {
      console.warn('Firestore topic delete error:', err);
    }
  };

  const handleResetToDefaults = async () => {
    setTopics(PRESET_TOPICS);
    setSelectedTopicId(PRESET_TOPICS[0].id);

    try {
      for (const t of PRESET_TOPICS) {
        await saveTopicFirestore(t);
      }
    } catch (err) {
      console.warn('Firestore reset defaults error:', err);
    }
  };

  // Team Handlers (Optimistic update + Firestore sync)
  const handleUpdateTeam = async (updated: Team) => {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    try {
      await saveTeamFirestore(updated);
    } catch (err) {
      console.warn('Firestore team update error:', err);
    }
  };

  const handleAddTeam = async (name: string, color: Team['color']) => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      color,
      score: 0,
      roundsPlayed: 0,
    };
    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);

    try {
      await saveTeamFirestore(newTeam);
    } catch (err) {
      console.warn('Firestore team add error:', err);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    setTeams((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (selectedTeamId === id && filtered.length > 0) {
        setSelectedTeamId(filtered[0].id);
      }
      return filtered;
    });

    try {
      await deleteTeamFirestore(id);
    } catch (err) {
      console.warn('Firestore team delete error:', err);
    }
  };

  const handleResetScores = async () => {
    const resetList = teams.map((t) => ({ ...t, score: 0, roundsPlayed: 0 }));
    setTeams(resetList);

    try {
      await resetTeamsScoresFirestore(resetList);
    } catch (err) {
      console.warn('Firestore team scores reset error:', err);
    }
  };

  // Round Completion: Persist round result to history and update team score in Firestore
  const handleRoundComplete = async (summary: RoundSummary) => {
    // 1. Update Team Score locally and in Firestore
    if (summary.teamId) {
      const targetTeam = teams.find((t) => t.id === summary.teamId);
      if (targetTeam) {
        const updatedTeam: Team = {
          ...targetTeam,
          score: targetTeam.score + summary.correctWords.length,
          roundsPlayed: (targetTeam.roundsPlayed || 0) + 1,
        };

        setTeams((prev) => prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));

        try {
          await saveTeamFirestore(updatedTeam);
        } catch (err) {
          console.warn('Firestore round score save error:', err);
        }
      }
    }

    // 2. Save Round History to Firestore
    try {
      await saveGameResultFirestore(summary);
    } catch (err) {
      console.warn('Firestore game result save error:', err);
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
        cloudStatus={cloudStatus}
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
