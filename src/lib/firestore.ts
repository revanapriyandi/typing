import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface ScoreEntry {
  id?: string;
  uid: string;
  displayName: string;
  photoURL: string;
  country: string;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  language: string;
  keystrokes?: { char: string; time: number; index: number }[];
  createdAt: Timestamp | null;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  country: string;
  bestWpm: number;
  totalTests: number;
  totalTime: number;
  achievements: string[];
  heatmap?: Record<string, { correct: number; incorrect: number }>;
  wpmHistory?: { date: string; wpm: number }[];
  createdAt: Timestamp | null;
}

export async function saveScore(score: Omit<ScoreEntry, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "scores"), {
    ...score,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getLeaderboard(
  timeFilter: "all" | "week" | "today",
  durationFilter: number | "all"
): Promise<ScoreEntry[]> {
  let q = query(collection(db, "scores"), orderBy("wpm", "desc"), limit(100));

  const now = new Date();
  if (timeFilter === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    q = query(
      collection(db, "scores"),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  } else if (timeFilter === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    q = query(
      collection(db, "scores"),
      where("createdAt", ">=", Timestamp.fromDate(weekAgo)),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }

  const snapshot = await getDocs(q);
  let scores: ScoreEntry[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEntry));

  if (durationFilter !== "all") {
    scores = scores.filter((s) => s.duration === durationFilter);
  }

  // Sort by WPM desc and deduplicate by uid (keep best per user)
  const bestByUser = new Map<string, ScoreEntry>();
  for (const score of scores) {
    const existing = bestByUser.get(score.uid);
    if (!existing || score.wpm > existing.wpm) {
      bestByUser.set(score.uid, score);
    }
  }

  return Array.from(bestByUser.values()).sort((a, b) => b.wpm - a.wpm);
}

export async function getOrCreateUserProfile(
  uid: string,
  displayName: string,
  photoURL: string
): Promise<UserProfile> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  const profile: UserProfile = {
    uid,
    displayName,
    photoURL,
    country: "Unknown",
    bestWpm: 0,
    totalTests: 0,
    totalTime: 0,
    achievements: [],
    heatmap: {},
    wpmHistory: [],
    createdAt: null,
  };
  await setDoc(userRef, { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export async function updateUserStats(
  uid: string,
  wpm: number,
  duration: number,
  sessionHeatmap: Record<string, { correct: number; incorrect: number }> = {}
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data() as UserProfile;
  
  // Merge heatmap
  const mergedHeatmap = { ...(data.heatmap || {}) };
  for (const [char, stats] of Object.entries(sessionHeatmap)) {
    if (!mergedHeatmap[char]) {
      mergedHeatmap[char] = { correct: 0, incorrect: 0 };
    }
    mergedHeatmap[char].correct += stats.correct;
    mergedHeatmap[char].incorrect += stats.incorrect;
  }

  // Update WPM history (keep last 30 tests)
  const history = data.wpmHistory || [];
  const newPoint = { date: new Date().toISOString(), wpm };
  const updatedHistory = [...history, newPoint].slice(-30);

  await updateDoc(userRef, {
    totalTests: increment(1),
    totalTime: increment(duration),
    bestWpm: wpm > data.bestWpm ? wpm : data.bestWpm,
    heatmap: mergedHeatmap,
    wpmHistory: updatedHistory,
  });
}

export async function unlockAchievements(uid: string, achievementIds: string[]): Promise<void> {
  if (achievementIds.length === 0) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    achievements: arrayUnion(...achievementIds),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getUserScores(uid: string): Promise<ScoreEntry[]> {
  const q = query(
    collection(db, "scores"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEntry));
}

export async function getTotalTestsCount(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, "meta", "stats"));
    return snap.exists() ? (snap.data().totalTests as number) : 0;
  } catch {
    return 0;
  }
}
