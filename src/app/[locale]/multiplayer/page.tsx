"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { createRoom, joinRoom, leaveRoom, listenToRoom, updatePlayerState, updateRoomStatus, RoomState } from "@/lib/realtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { Users, Play, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { Character } from "@/components/Character";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function MultiplayerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRoom = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(queryRoom || null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const t = useTranslations("Multiplayer");

  // Engine only used when playing
  const engine = useTypingEngine({
    mode: "words",
    duration: 40,
    language: "english",
    initialText: room?.text
  });

  // Handle Room Connection
  useEffect(() => {
    if (!roomId || !user) return;
    
    // Auto-join if coming from link
    if (queryRoom && !room) {
      joinRoom(roomId, user.uid, user.displayName || "Anonymous", user.photoURL || "").catch(e => {
        toast.error("Failed to join room: " + e.message);
        router.push("/multiplayer");
        setRoomId(null);
      });
    }

    const unsub = listenToRoom(roomId, (data) => {
      if (!data) {
        toast.error("Room was closed");
        setRoomId(null);
        router.push("/multiplayer");
        return;
      }
      setRoom(data);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  // Sync Progress to Firebase
  useEffect(() => {
    if (room?.status === "playing" && roomId && user) {
      const p = Math.floor((engine.currentIndex / Math.max(1, engine.chars.length)) * 100);
      updatePlayerState(roomId, user.uid, { 
        progress: p, 
        wpm: engine.stats.wpm,
        finishedAt: engine.stats.isFinished ? Date.now() : null
      });
    }
  }, [engine.currentIndex, engine.chars.length, engine.stats.wpm, engine.stats.isFinished, room?.status, roomId, user]);

  // Tab switch & Reload active session warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (room?.status === "playing" && !engine.stats.isFinished) {
        e.preventDefault();
        e.returnValue = ""; 
        return ""; 
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && room?.status === "playing" && !engine.stats.isFinished) {
        setShowExitWarning(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [room?.status, engine.stats.isFinished]);

  // Handle countdown
  useEffect(() => {
    if (room?.status === "countdown" && room.countdownStart) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - room.countdownStart!) / 1000;
        const left = Math.ceil(5 - elapsed); // 5 sec countdown
        if (left <= 0) {
          setCountdown(0);
          if (room.hostId === user?.uid) {
            updateRoomStatus(room.roomId, "playing");
          }
        } else {
          setCountdown(left);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    if (room?.status === "playing") setCountdown(null);
  }, [room?.status, room?.countdownStart, room?.hostId, room?.roomId, user?.uid]);

  const handleCreateRoom = async () => {
    if (!user) { toast.error("Sign in to create a room"); return; }
    try {
      const id = await createRoom(user.uid, user.displayName || "Anonymous", user.photoURL || "");
      setRoomId(id);
      router.push(`/multiplayer?room=${id}`);
      toast.success("Room created!");
    } catch { toast.error("Error creating room"); }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Sign in to join a room"); return; }
    if (!joinCode) return;
    try {
      await joinRoom(joinCode.toUpperCase(), user.uid, user.displayName || "Anonymous", user.photoURL || "");
      setRoomId(joinCode.toUpperCase());
      router.push(`/multiplayer?room=${joinCode.toUpperCase()}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleLeave = () => {
    if (roomId && user) {
      leaveRoom(roomId, user.uid, room?.hostId === user.uid);
    }
    setRoomId(null);
    setRoom(null);
    engine.reset();
    router.push("/multiplayer");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && roomId) {
      navigator.clipboard.writeText(`${window.location.origin}/multiplayer?room=${roomId}`);
      toast.success("Invite link copied!");
    }
  };

  const isHost = room?.hostId === user?.uid;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
        <p className="text-muted-foreground mb-6">{t("requiresAuth")}</p>
      </div>
    );
  }

  if (!roomId || !room) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black font-mono tracking-tighter">{t("heroTitle")} <span className="text-primary">{t("heroAccent")}</span></h1>
          <p className="text-muted-foreground">{t("heroDesc")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-muted/30 border-border/40 backdrop-blur shadow-xl">
            <CardHeader>
              <CardTitle>{t("createRoom")}</CardTitle>
              <CardDescription>{t("createRoomDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateRoom} className="w-full h-12 text-lg font-bold"><Play className="w-5 h-5 mr-2"/> {t("hostBtn")}</Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border/40 backdrop-blur shadow-xl">
            <CardHeader>
              <CardTitle>{t("joinRoom")}</CardTitle>
              <CardDescription>{t("joinRoomDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSubmit} className="flex gap-2">
                <Input 
                  value={joinCode} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)} 
                  placeholder={t("joinCodeParam")} 
                  className="font-mono uppercase h-12 text-lg text-center"
                  maxLength={6}
                />
                <Button type="submit" className="h-12 w-24"><Users className="w-5 h-5"/></Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active Room UI
  const players = Object.values(room.players).sort((a, b) => b.progress - a.progress);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Lobby Header */}
      <div className="flex items-center justify-between bg-muted/30 border border-border/40 p-4 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleLeave}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h2 className="text-xl font-bold font-mono">{t("roomIdLabel")} <span className="text-primary">{room.roomId}</span></h2>
            <p className="text-sm text-muted-foreground">{Object.keys(room.players).length} {t("connected")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCopyLink}><LinkIcon className="w-4 h-4 mr-2" /> {t("inviteBtn")}</Button>
          {isHost && room.status === "waiting" && Object.keys(room.players).length > 1 && (
            <Button onClick={() => updateRoomStatus(room.roomId, "countdown")} className="font-bold">{t("startBtn")}</Button>
          )}
          {isHost && room.status === "waiting" && Object.keys(room.players).length === 1 && (
            <Button disabled className="opacity-50">{t("waitBtn")}</Button>
          )}
          {room.status === "countdown" && <Button disabled className="animate-pulse">{t("startingBtn", { countdown: countdown ?? 0 })}</Button>}
        </div>
      </div>

      {/* Racetrack */}
      <div className="bg-background/50 border border-border/40 p-6 rounded-xl shadow-2xl flex flex-col gap-6 backdrop-blur">
        {players.map((p) => (
          <div key={p.displayName} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 rounded-md"><AvatarImage src={p.photoURL} /><AvatarFallback>{p.displayName[0]}</AvatarFallback></Avatar>
                <span className="font-bold text-sm">{p.displayName} {room.hostId === Object.keys(room.players).find(k => room.players[k].displayName === p.displayName) && "(Host)"}</span>
              </div>
              {p.finishedAt ? <span className="text-sm font-mono text-emerald-500 font-bold">{p.wpm} WPM</span> : <span className="text-xs text-muted-foreground font-mono">{p.progress}%</span>}
            </div>
            <div className="w-full relative h-6 bg-muted rounded-full overflow-hidden border border-border/50">
               <div className={`h-full transition-all duration-300 ${p.finishedAt ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${p.progress}%` }} />
               {/* Car avatar floating above right edge logic could go here */}
            </div>
          </div>
        ))}
      </div>

      {/* Typing Area (Only active during play) */}
      {room.status !== "waiting" && (
        <div className="w-full mt-4 p-8 bg-background border border-border/40 rounded-xl shadow-2xl relative">
          {room.status === "countdown" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
              <span className="text-9xl font-black font-mono text-primary animate-bounce">{countdown}</span>
            </div>
          )}
          
          <div
            className="font-mono text-3xl md:text-4xl leading-[1.6] select-none break-words whitespace-pre-wrap outline-none w-full"
            tabIndex={0}
            autoFocus
          >
            {engine.chars.map((c, i) => (
              <Character 
                key={i} 
                char={c.char} 
                status={i < engine.currentIndex ? c.status : "pending"} 
                isCurrent={i === engine.currentIndex} 
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Switch Warning Dialog ── */}
      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent className="bg-background border-border/40 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-destructive">⚠️</span> Race Interrupted
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You switched tabs or lost focus during an active multiplayer race. Do you want to continue racing or leave the room?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowExitWarning(false)} className="border-border/40">
              Continue Race
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowExitWarning(false);
                handleLeave();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Leave Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default function MultiplayerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading multiplayer...</div>}>
      <MultiplayerContent />
    </Suspense>
  );
}
