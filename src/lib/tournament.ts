import { db, rtdb } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot as onFirestoreSnapshot,
  arrayUnion
} from "firebase/firestore";
import { 
  ref, 
  set, 
  onValue, 
  update, 
  get
} from "firebase/database";

export interface TournamentParticipant {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  status: "registration" | "active" | "completed";
  startTime: number;
  maxPlayers: number; // e.g. 8
  participants: TournamentParticipant[];
  prizePool: string;
  rundown: {
    quarterFinals: number;
    semiFinals: number;
    finals: number;
  };
  winnerUid?: string;
}

export interface MatchPlayer extends TournamentParticipant {
  wpm?: number;
  progress?: number;
  finishedAt?: number | null;
}

export interface TournamentMatch {
  id: string; // e.g. "qf1", "sf1", "f1"
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  status: "scheduled" | "active" | "completed";
  winnerUid: string | null;
  roomId: string | null; // references RTDB /rooms/
}

export interface TournamentBracket {
  quarterFinals: Record<string, TournamentMatch>;
  semiFinals: Record<string, TournamentMatch>;
  finals: Record<string, TournamentMatch>;
}

// ── FIRESTORE: Tournament Metadata ──

export async function createTournament(tournament: Omit<Tournament, "id">): Promise<string> {
  const newRef = doc(collection(db, "tournaments"));
  const newDoc = { id: newRef.id, ...tournament };
  await setDoc(newRef, newDoc);
  
  // Initialize empty bracket in RTDB
  if (tournament.maxPlayers === 8) {
    const bracketRef = ref(rtdb, `tournaments/${newRef.id}/bracket`);
    await set(bracketRef, {
      quarterFinals: {
        qf1: { id: "qf1", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
        qf2: { id: "qf2", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
        qf3: { id: "qf3", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
        qf4: { id: "qf4", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
      },
      semiFinals: {
        sf1: { id: "sf1", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
        sf2: { id: "sf2", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
      },
      finals: {
        f1: { id: "f1", player1: null, player2: null, status: "scheduled", winnerUid: null, roomId: null },
      }
    });
  }
  
  return newRef.id;
}

export async function getTournaments(): Promise<Tournament[]> {
  const q = query(collection(db, "tournaments"), orderBy("startTime", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Tournament);
}

export function listenToTournaments(callback: (tournaments: Tournament[]) => void) {
  const q = query(collection(db, "tournaments"), orderBy("startTime", "desc"));
  return onFirestoreSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Tournament));
  });
}

export async function getTournamentInfo(tournamentId: string): Promise<Tournament | null> {
  const d = await getDoc(doc(db, "tournaments", tournamentId));
  return d.exists() ? (d.data() as Tournament) : null;
}

export async function joinTournament(tournamentId: string, participant: TournamentParticipant) {
  const tourneyRef = doc(db, "tournaments", tournamentId);
  await updateDoc(tourneyRef, {
    participants: arrayUnion(participant)
  });
}

// ── REALTIME DB: Bracket State ──

export function listenToBracket(tournamentId: string, callback: (bracket: TournamentBracket | null) => void) {
  const bracketRef = ref(rtdb, `tournaments/${tournamentId}/bracket`);
  return onValue(bracketRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export async function joinTournamentMatch(
  tournamentId: string, 
  stage: keyof TournamentBracket, 
  matchId: string, 
  match: TournamentMatch, 
  user: { uid: string, displayName: string, photoURL: string }
): Promise<string> {
  let roomId = match.roomId;
  
  if (!roomId) {
     // Create a new RTDB room dynamically using Realtime logic
     const { createRoom } = await import('./realtime');
     roomId = await createRoom(user.uid, user.displayName, user.photoURL);
     
     // Save the new roomId back to the tournament bracket match
     const matchRef = ref(rtdb, `tournaments/${tournamentId}/bracket/${stage}/${matchId}`);
     await update(matchRef, { roomId, status: "active" });
  } else {
     // Join the existing room
     const { joinRoom } = await import('./realtime');
     try {
       await joinRoom(roomId, user.uid, user.displayName, user.photoURL);
     } catch (e) {
       // Ignore if player is already in room or race started
       console.log("Join room error or already joined:", e);
     }
  }
  return roomId;
}

// Admin/Server-like function to generate seeds
export async function generateBracketFromParticipants(tournamentId: string, participants: TournamentParticipant[]) {
  // Simple ordered seating for 8 players
  const qfMatches: Record<string, Partial<TournamentMatch>> = {};
  for (let i = 0; i < 4; i++) {
    qfMatches[`qf${i+1}`] = {
      player1: participants[i * 2] || null,
      player2: participants[i * 2 + 1] || null,
      status: "scheduled",
    };
  }
  
  const updates: Record<string, unknown> = {};
  for(let i=1; i<=4; i++) {
    if(qfMatches[`qf${i}`].player1) updates[`tournaments/${tournamentId}/bracket/quarterFinals/qf${i}/player1`] = qfMatches[`qf${i}`].player1;
    if(qfMatches[`qf${i}`].player2) updates[`tournaments/${tournamentId}/bracket/quarterFinals/qf${i}/player2`] = qfMatches[`qf${i}`].player2;
  }
  
  // Optionally change status to active
  await update(ref(rtdb), updates);
  
  const tourneyRef = doc(db, "tournaments", tournamentId);
  await updateDoc(tourneyRef, { status: "active" });
}

export async function updateMatchWinner(tournamentId: string, stage: keyof TournamentBracket, matchId: string, winnerUid: string) {
  // 1. Set winner in current match
  const matchRef = ref(rtdb, `tournaments/${tournamentId}/bracket/${stage}/${matchId}`);
  await update(matchRef, { winnerUid, status: "completed" });
  
  // 2. Advance to next round
  const bracketSnap = await get(ref(rtdb, `tournaments/${tournamentId}/bracket`));
  const bracket = bracketSnap.val() as TournamentBracket;
  const match = bracket[stage][matchId];
  
  const winner = match.player1?.uid === winnerUid ? match.player1 : match.player2;
  if (!winner) return;

  const updates: Record<string, unknown> = {};
  
  if (stage === "quarterFinals") {
    // qf1 & qf2 -> sf1
    // qf3 & qf4 -> sf2
    const nextMatchId = (matchId === "qf1" || matchId === "qf2") ? "sf1" : "sf2";
    const slot = (matchId === "qf1" || matchId === "qf3") ? "player1" : "player2";
    updates[`tournaments/${tournamentId}/bracket/semiFinals/${nextMatchId}/${slot}`] = winner;
  } else if (stage === "semiFinals") {
    // sf1 & sf2 -> f1
    const slot = matchId === "sf1" ? "player1" : "player2";
    updates[`tournaments/${tournamentId}/bracket/finals/f1/${slot}`] = winner;
  } else if (stage === "finals") {
    // Tournament Over! Save winner to Firestore
    const tourneyRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tourneyRef, { winnerUid: winnerUid, status: "completed" });
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates);
  }
}

// ── Admin: Seed Mock Tournaments ── 
export async function mockCreateUpcomingTournament() {
  const now = Date.now();
  await createTournament({
    title: "TypeRush Weekly Championship",
    description: "Compete against the top 8 typists of the week for an exclusive badge and global glory. Single elimination format.",
    status: "registration",
    startTime: now + 3600000, // 1 hour from now
    maxPlayers: 8,
    participants: [],
    prizePool: "Diamond Badge + Global Headline",
    rundown: {
      quarterFinals: now + 3600000,       // T+0
      semiFinals: now + 3600000 + 600000, // T+10m
      finals: now + 3600000 + 1200000,     // T+20m
    }
  });
}
