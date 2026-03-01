import { rtdb } from "./firebase";
import { ref, set, get, update, onValue, off, remove, serverTimestamp, DataSnapshot } from "firebase/database";
import { generateParagraph } from "./words";

export type RoomStatus = "waiting" | "countdown" | "playing" | "finished";

export interface PlayerState {
  displayName: string;
  photoURL: string;
  progress: number;
  wpm: number;
  isReady: boolean;
  finishedAt: number | null;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  status: RoomStatus;
  text: string;
  players: Record<string, PlayerState>;
  countdownStart?: number;
  createdAt: object;
}

// Generate a 6-character room code
const generateRoomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 })
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join("");
};

export const createRoom = async (uid: string, displayName: string, photoURL: string): Promise<string> => {
  const roomId = generateRoomId();
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  
  // Checking if exists (highly unlikely due to random 6 chars, but good practice)
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createRoom(uid, displayName, photoURL); 
  }

  const initialText = generateParagraph("english", 40); // Default to english, 40 words

  const newRoom: RoomState = {
    roomId,
    hostId: uid,
    status: "waiting",
    text: initialText,
    createdAt: serverTimestamp(),
    players: {
      [uid]: {
        displayName,
        photoURL,
        progress: 0,
        wpm: 0,
        isReady: false,
        finishedAt: null
      }
    }
  };

  await set(roomRef, newRoom);
  return roomId;
};

export const joinRoom = async (roomId: string, uid: string, displayName: string, photoURL: string) => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    throw new Error("Room not found");
  }

  const room = snapshot.val() as RoomState;
  if (room.status !== "waiting") {
    throw new Error("Race has already started");
  }

  // Add user to players
  await update(ref(rtdb, `rooms/${roomId}/players/${uid}`), {
    displayName,
    photoURL,
    progress: 0,
    wpm: 0,
    isReady: false,
    finishedAt: null
  });
};

export const leaveRoom = async (roomId: string, uid: string, isHost: boolean) => {
  if (isHost) {
    // If host leaves before playing, destroy the room
    await remove(ref(rtdb, `rooms/${roomId}`));
  } else {
    await remove(ref(rtdb, `rooms/${roomId}/players/${uid}`));
  }
};

export const updatePlayerState = async (roomId: string, uid: string, updates: Partial<PlayerState>) => {
  await update(ref(rtdb, `rooms/${roomId}/players/${uid}`), updates);
};

export const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
  const updates: Record<string, unknown> = { status };
  if (status === "countdown") {
    updates.countdownStart = serverTimestamp();
  }
  await update(ref(rtdb, `rooms/${roomId}`), updates);
};

export const listenToRoom = (roomId: string, callback: (room: RoomState | null) => void) => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  
  const handleData = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RoomState);
    } else {
      callback(null);
    }
  };

  onValue(roomRef, handleData);
  
  return () => {
    off(roomRef, "value", handleData);
  };
};
