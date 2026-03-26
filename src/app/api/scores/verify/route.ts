import { NextRequest, NextResponse } from "next/server";

interface KeystrokeEntry {
  key: string;
  time: number;
  index: number;
}

interface SessionPayload {
  displayName: string;
  photoURL: string;
  country: string;
  duration: number;
  mode: string;
  language: string;
  sourceText: string;
  keystrokes: KeystrokeEntry[];
  timeElapsed: number;
}

function parseUidFromIdToken(idToken: string): string | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { user_id?: string; sub?: string };
    return payload.user_id || payload.sub || null;
  } catch {
    return null;
  }
}

function calculateOfficialStats(session: SessionPayload) {
  const text = session.sourceText || "";
  const chars = text.split("").map((char) => ({ char, status: "pending" as "pending" | "correct" | "incorrect" }));

  let currentIndex = 0;
  let correctChars = 0;
  let incorrectChars = 0;

  for (const stroke of session.keystrokes || []) {
    if (stroke.key === "Backspace") {
      if (currentIndex > 0) {
        const prevIdx = currentIndex - 1;
        if (chars[prevIdx].status === "incorrect") {
          incorrectChars = Math.max(0, incorrectChars - 1);
        } else if (chars[prevIdx].status === "correct") {
          correctChars = Math.max(0, correctChars - 1);
        }
        chars[prevIdx] = { ...chars[prevIdx], status: "pending" };
        currentIndex = prevIdx;
      }
      continue;
    }

    if (typeof stroke.key !== "string" || stroke.key.length !== 1) continue;
    if (currentIndex >= text.length) continue;

    const isCorrect = stroke.key === text[currentIndex];
    chars[currentIndex] = { ...chars[currentIndex], status: isCorrect ? "correct" : "incorrect" };

    if (isCorrect) correctChars += 1;
    else incorrectChars += 1;

    currentIndex += 1;

    if (session.mode.endsWith("w") && currentIndex >= text.length) {
      break;
    }
  }

  const totalTyped = correctChars + incorrectChars;

  const elapsedFromKeystrokes =
    session.keystrokes.length > 0
      ? Math.max(0, ...session.keystrokes.map((k) => k.time || 0)) / 1000
      : 0;

  const timeElapsed = session.mode.endsWith("s")
    ? Math.max(1, session.duration)
    : Math.max(0.01, elapsedFromKeystrokes || session.timeElapsed || 0.01);

  const timeMins = timeElapsed / 60;
  const wpm = timeMins > 0 ? Math.round((correctChars / 5) / timeMins) : 0;
  const rawWpm = timeMins > 0 ? Math.round((totalTyped / 5) / timeMins) : 0;
  const accuracy = totalTyped > 0
    ? (incorrectChars === 0 ? 100 : Math.floor((correctChars / totalTyped) * 100))
    : 100;

  return {
    wpm,
    rawWpm,
    accuracy,
    correctChars,
    incorrectChars,
    totalTyped,
    timeElapsed,
  };
}

function toFirestoreDoc(data: {
  uid: string;
  displayName: string;
  photoURL: string;
  country: string;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  language: string;
  keystrokes: KeystrokeEntry[];
}) {
  return {
    fields: {
      uid: { stringValue: data.uid },
      displayName: { stringValue: data.displayName || "Anonymous" },
      photoURL: { stringValue: data.photoURL || "" },
      country: { stringValue: data.country || "Unknown" },
      wpm: { integerValue: String(data.wpm) },
      accuracy: { integerValue: String(data.accuracy) },
      duration: { integerValue: String(data.duration) },
      mode: { stringValue: data.mode },
      language: { stringValue: data.language },
      keystrokes: {
        arrayValue: {
          values: data.keystrokes.map((k) => ({
            mapValue: {
              fields: {
                key: { stringValue: k.key },
                time: { integerValue: String(Math.max(0, Math.floor(k.time || 0))) },
                index: { integerValue: String(Math.max(0, Math.floor(k.index || 0))) },
              },
            },
          })),
        },
      },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const uid = parseUidFromIdToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    }

    const body = (await req.json()) as { session?: SessionPayload };
    const session = body.session;
    if (!session || !session.sourceText || !Array.isArray(session.keystrokes)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const verified = calculateOfficialStats(session);

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json({ error: "Missing Firebase project config" }, { status: 500 });
    }

    const writeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/scores`;
    const writeRes = await fetch(writeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(toFirestoreDoc({
        uid,
        displayName: session.displayName,
        photoURL: session.photoURL,
        country: session.country,
        wpm: verified.wpm,
        accuracy: verified.accuracy,
        duration: session.duration,
        mode: session.mode,
        language: session.language,
        keystrokes: session.keystrokes,
      })),
    });

    const writeData = (await writeRes.json().catch(() => null)) as { name?: string; error?: { message?: string } } | null;
    if (!writeRes.ok || !writeData?.name) {
      return NextResponse.json({ error: writeData?.error?.message || "Failed to save score" }, { status: writeRes.status || 500 });
    }

    const scoreId = writeData.name.split("/").pop() || "";

    return NextResponse.json({
      scoreId,
      ...verified,
    });
  } catch (error) {
    console.error("score verify error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
