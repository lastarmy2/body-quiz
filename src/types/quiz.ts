export interface QuizTopic {
  id: string;
  title: string;
  description: string;
  emoji: string;
  words: string[];
  isCustom?: boolean;
  createdAt?: number;
}

export interface Team {
  id: string;
  name: string;
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'pink';
  score: number;
  roundsPlayed: number;
}

export type FontSizeOption = 'normal' | 'large' | 'huge';

export interface GameSettings {
  timeLimit: number; // in seconds (0 = unlimited)
  passLimit: number; // 0 = unlimited
  shuffle: boolean;
  fontSize: FontSizeOption;
  showWordLength: boolean;
  showCategory: boolean;
  soundEnabled: boolean;
  stageMode: 'light' | 'stageDark'; // light or auditorium projector dark
}

export interface GameWordResult {
  word: string;
  status: 'correct' | 'passed';
  timestamp: number;
}

export interface RoundSummary {
  topicTitle: string;
  topicEmoji: string;
  teamId?: string;
  teamName?: string;
  teamColor?: Team['color'];
  correctWords: string[];
  passedWords: string[];
  remainingWords: string[];
  totalTime: number;
  timeSpent: number;
  date: number;
}
