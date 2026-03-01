"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { createRoom, joinRoom, leaveRoom, listenToRoom, updatePlayerState, updateRoomStatus, RoomState, findPublicRoom, sendChatMessage, listenToChat, ChatMessage } from "@/lib/realtime";
import { updateMatchWinner, TournamentBracket } from "@/lib/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { Users, Play, ArrowLeft, ArrowRight, Link as LinkIcon, Globe, Send } from "lucide-react";
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
  const isSpectating = searchParams.get("spectate") === "true";
  const queryTourney = searchParams.get("tournamentId");
  const queryStage = searchParams.get("stage") as keyof TournamentBracket | null;
  const queryMatch = searchParams.get("matchId");

  const [roomId, setRoomId] = useState<string | null>(queryRoom || null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
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
    
    // Auto-join if coming from link (unless spectating)
    if (queryRoom && !room && !isSpectating) {
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

    const unsubChat = listenToChat(roomId, (msgs) => setChatMessages(msgs));

    return () => { unsub(); unsubChat(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  // Sync Progress to Firebase (only if playing, not spectating)
  useEffect(() => {
    if (room?.status === "playing" && roomId && user && !isSpectating) {
      const p = Math.floor((engine.currentIndex / Math.max(1, engine.chars.length)) * 100);
      updatePlayerState(roomId, user.uid, { 
        progress: p, 
        wpm: engine.stats.wpm,
        finishedAt: engine.stats.isFinished ? Date.now() : null
      });

      // Handle Tournament Win condition
      if (engine.stats.isFinished && queryTourney && queryStage && queryMatch) {
         updateMatchWinner(queryTourney, queryStage, queryMatch, user.uid).catch(console.error);
         updateRoomStatus(roomId, "finished").catch(console.error);
         toast.success("Match Finished! Tournament Bracket Updated.", { duration: 5000 });
      }
    }
  }, [engine.currentIndex, engine.chars.length, engine.stats.wpm, engine.stats.isFinished, room?.status, roomId, user, isSpectating, queryTourney, queryStage, queryMatch]);

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

  const handleMatchmake = async () => {
    if (!user) { toast.error("Sign in to find a match"); return; }
    setIsMatchmaking(true);
    try {
      const id = await findPublicRoom(user.uid, user.displayName || "Anonymous", user.photoURL || "");
      setRoomId(id);
      router.push(`/multiplayer?room=${id}`);
      toast.success("Joined a public match!");
    } catch { 
      toast.error("Error finding match. Try creating one!"); 
    } finally {
      setIsMatchmaking(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !roomId) return;
    await sendChatMessage(roomId, user.uid, user.displayName || "Anon", chatInput.trim());
    setChatInput("");
  };

  const handleLeave = () => {
    if (roomId && user && !isSpectating) {
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
      <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center space-y-4 mb-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
             <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-mono tracking-tighter">{t("heroTitle")} <span className="bg-gradient-to-br from-indigo-500 via-primary to-purple-500 bg-clip-text text-transparent drop-shadow-sm">{t("heroAccent")}</span></h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t("heroDesc")}</p>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-8 mt-4">
          {/* Primary Action */}
          <div 
             onClick={handleMatchmake}
             className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/25 border border-indigo-500/20"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-800 opacity-90 group-hover:opacity-100 transition-opacity"></div>
             {/* decorative blob */}
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl transition-transform group-hover:scale-110 duration-500"></div>
             <div className="relative p-8 md:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                   <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Public Match</h2>
                   <p className="text-indigo-100/80 text-lg">Jump into a random typing race against global players instantly.</p>
                </div>
                <div className="flex-shrink-0">
                   <div className="h-16 px-8 bg-white text-indigo-900 font-bold text-lg rounded-full flex items-center justify-center gap-2 group-hover:bg-indigo-50 transition-colors shadow-lg">
                      <Play className="w-6 h-6 fill-current" />
                      Find Match
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 my-8 opacity-50">
             <div className="h-px bg-border flex-1"></div>
             <span className="font-mono text-sm uppercase tracking-widest font-bold">OR PRIVATE ROOMS</span>
             <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-background/60 border-border/40 backdrop-blur-md shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300">
                   <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t("createRoom")}</CardTitle>
                <CardDescription className="text-base">{t("createRoomDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button variant="outline" onClick={handleCreateRoom} className="w-full h-14 text-base font-bold bg-background/50 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors hover:border-primary/40">
                  <Play className="w-5 h-5 mr-2"/> {t("hostBtn")}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background/60 border-border/40 backdrop-blur-md shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300">
                   <LinkIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t("joinRoom")}</CardTitle>
                <CardDescription className="text-base">{t("joinRoomDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <form onSubmit={handleJoinSubmit} className="flex gap-2 relative">
                  <Input 
                    value={joinCode} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)} 
                    placeholder={t("joinCodeParam")} 
                    className="font-mono uppercase h-14 text-lg text-left pl-4 pr-16 bg-background/50 border-primary/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all shadow-inner"
                    maxLength={6}
                  />
                  <Button type="submit" className="absolute right-1 top-1 bottom-1 h-12 w-14 p-0 shadow-md">
                    <ArrowRight className="w-6 h-6"/>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Global Matchmaking Splash Overlay */}
        {isMatchmaking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6 p-8 bg-background/50 border border-primary/20 rounded-2xl shadow-2xl">
               <div className="relative flex items-center justify-center w-24 h-24">
                 <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                 <Globe className="w-8 h-8 text-primary animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                 <h2 className="text-2xl font-black font-mono tracking-tighter bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">Finding Opponent</h2>
                 <p className="text-muted-foreground animate-pulse text-sm">Searching global rooms...</p>
               </div>
            </div>
          </div>
        )}
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
            <h2 className="text-xl font-bold font-mono flex items-center gap-2">
              {t("roomIdLabel")} <span className="text-primary">{room.roomId}</span>
              {isSpectating && <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 ml-2 animate-pulse">SPECTATING</Badge>}
            </h2>
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

      {/* Typing Area (Only active during play, hidden for spectators) */}
      {room.status !== "waiting" && !isSpectating && (
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

      {/* Live Chat Area */}
      <div className="mt-4 bg-muted/20 border border-border/40 rounded-xl flex flex-col h-64 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {chatMessages.length === 0 ? (
            <div className="text-muted-foreground text-sm m-auto opacity-50">No messages yet. Say hi!</div>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} className="text-sm">
                <span className="font-bold text-primary mr-2">{msg.displayName}:</span>
                <span className="text-foreground/80">{msg.text}</span>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendChat} className="p-3 bg-muted/40 border-t border-border/40 flex gap-2">
           <Input 
             value={chatInput} 
             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
             placeholder="Type a message..."
             className="flex-1 bg-background"
           />
           <Button type="submit" size="icon" disabled={!chatInput.trim()}><Send className="w-4 h-4" /></Button>
        </form>
      </div>

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
