import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { QuizTopic, Team, RoundSummary } from '../types/quiz';

// Initialize Firebase App and Firestore with explicit firestoreDatabaseId
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// --- Firestore Data Operations ---

const TOPICS_COLLECTION = 'topics';
const TEAMS_COLLECTION = 'teams';
const RESULTS_COLLECTION = 'game_results';

// Real-time Topics Subscription
export function subscribeToTopics(
  onData: (topics: QuizTopic[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, TOPICS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: QuizTopic[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as QuizTopic);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TOPICS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

// Save/Update Topic
export async function saveTopicFirestore(topic: QuizTopic) {
  const path = `${TOPICS_COLLECTION}/${topic.id}`;
  try {
    await setDoc(doc(db, TOPICS_COLLECTION, topic.id), {
      id: topic.id,
      title: topic.title,
      description: topic.description || '',
      emoji: topic.emoji || '📌',
      words: topic.words || [],
      isCustom: !!topic.isCustom,
      createdAt: topic.createdAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Delete Topic
export async function deleteTopicFirestore(id: string) {
  const path = `${TOPICS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TOPICS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Seed Initial Preset Topics to Firestore if empty
export async function seedTopicsIfEmpty(presetTopics: QuizTopic[]) {
  try {
    const colRef = collection(db, TOPICS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const batch = writeBatch(db);
      presetTopics.forEach((t) => {
        const ref = doc(db, TOPICS_COLLECTION, t.id);
        batch.set(ref, {
          id: t.id,
          title: t.title,
          description: t.description || '',
          emoji: t.emoji || '📌',
          words: t.words,
          isCustom: false,
          createdAt: Date.now(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TOPICS_COLLECTION);
  }
}

// Real-time Teams Subscription
export function subscribeToTeams(
  onData: (teams: Team[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, TEAMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Team[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Team);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TEAMS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

// Save/Update Team
export async function saveTeamFirestore(team: Team) {
  const path = `${TEAMS_COLLECTION}/${team.id}`;
  try {
    await setDoc(doc(db, TEAMS_COLLECTION, team.id), {
      id: team.id,
      name: team.name,
      color: team.color,
      score: team.score,
      roundsPlayed: team.roundsPlayed || 0,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Delete Team
export async function deleteTeamFirestore(id: string) {
  const path = `${TEAMS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TEAMS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Reset All Teams Scores in Firestore
export async function resetTeamsScoresFirestore(teams: Team[]) {
  try {
    const batch = writeBatch(db);
    teams.forEach((team) => {
      const ref = doc(db, TEAMS_COLLECTION, team.id);
      batch.update(ref, { score: 0, roundsPlayed: 0 });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TEAMS_COLLECTION);
    throw error;
  }
}

// Seed Initial Teams if empty
export async function seedTeamsIfEmpty(initialTeams: Team[]) {
  try {
    const colRef = collection(db, TEAMS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const batch = writeBatch(db);
      initialTeams.forEach((team) => {
        const ref = doc(db, TEAMS_COLLECTION, team.id);
        batch.set(ref, {
          id: team.id,
          name: team.name,
          color: team.color,
          score: team.score,
          roundsPlayed: team.roundsPlayed,
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TEAMS_COLLECTION);
  }
}

// Save Round Result
export async function saveGameResultFirestore(summary: RoundSummary) {
  const resultId = 'result-' + Date.now();
  const path = `${RESULTS_COLLECTION}/${resultId}`;
  try {
    await setDoc(doc(db, RESULTS_COLLECTION, resultId), {
      id: resultId,
      topicTitle: summary.topicTitle,
      topicEmoji: summary.topicEmoji || '⭐',
      teamId: summary.teamId || '',
      teamName: summary.teamName || '참가팀',
      correctCount: summary.correctWords.length,
      passedCount: summary.passedWords.length,
      correctWords: summary.correctWords,
      passedWords: summary.passedWords,
      timeSpent: summary.timeSpent,
      playedAt: summary.date || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Subscribe to recent game results (for history or hall of fame)
export function subscribeToGameResults(
  onData: (results: Array<{
    id: string;
    topicTitle: string;
    topicEmoji: string;
    teamName: string;
    correctCount: number;
    passedCount: number;
    timeSpent: number;
    playedAt: number;
  }>) => void
) {
  const q = query(collection(db, RESULTS_COLLECTION), orderBy('playedAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((d) => items.push(d.data()));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, RESULTS_COLLECTION);
    }
  );
}
