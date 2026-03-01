"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  getTournamentInfo, 
  listenToBracket, 
  generateBracketFromParticipants,
  joinTournamentMatch,
  Tournament, 
  TournamentBracket, 
  TournamentMatch
} from "@/lib/tournament";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Clock, ArrowLeft, Play, Users, Sword } from "lucide-react";
import { format } from "date-fns";

export default function TournamentBracketPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [tourney, setTourney] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch static tourney info (Firestore)
    getTournamentInfo(id).then(t => {
      setTourney(t);
      setLoading(false);
    }).catch(() => setLoading(false));

    // 2. Listen to live bracket (RTDB)
    const unsub = listenToBracket(id, (b) => {
      setBracket(b);
    });
    return () => unsub();
  }, [id]);

  const handleGenerateBracket = async () => {
    if (!tourney) return;
    if (tourney.participants.length < 2) {
      toast.error("Not enough participants to start");
      return;
    }
    try {
      await generateBracketFromParticipants(tourney.id, tourney.participants);
      toast.success("Bracket generated! Tournament is now active.");
      // Refresh local state
      const t = await getTournamentInfo(id);
      setTourney(t);
    } catch {
      toast.error("Error generating bracket");
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading bracket...</div>;
  if (!tourney) return <div className="text-center py-20 text-destructive font-bold">Tournament not found</div>;

  const renderMatch = (title: string, match: TournamentMatch | undefined, scheduledTime: number, stage: keyof TournamentBracket) => {
    if (!match) return (
      <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border/40 rounded-lg w-full max-w-[200px] opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
        <div className="flex items-center gap-2 p-2 bg-background rounded border border-dashed border-border"><div className="w-5 h-5 rounded-full bg-muted-foreground/20"/><span className="text-xs">TBD</span></div>
        <div className="flex items-center gap-2 p-2 bg-background rounded border border-dashed border-border"><div className="w-5 h-5 rounded-full bg-muted-foreground/20"/><span className="text-xs">TBD</span></div>
      </div>
    );

    const isLive = match.status === "active";
    const isCompleted = match.status === "completed";

    return (
      <div className={`relative flex flex-col gap-2 p-3 rounded-xl w-full max-w-[220px] transition-all
        ${isLive ? 'bg-primary/10 border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-105 z-10' : 'bg-muted/30 border border-border/50'}
      `}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
          {isLive && <Badge className="bg-red-500 hover:bg-red-600 text-[9px] h-4 px-1 animate-pulse">LIVE</Badge>}
          {!isLive && !isCompleted && <span className="text-[10px] font-mono opacity-50">{format(scheduledTime, "HH:mm")}</span>}
          {isCompleted && <Badge variant="outline" className="text-[9px] h-4 px-1 opacity-50 border-emerald-500 text-emerald-500">DONE</Badge>}
        </div>

        {/* Player 1 */}
        <div className={`flex items-center justify-between p-2 rounded border transition-colors
          ${match.winnerUid === match.player1?.uid ? 'bg-emerald-500/10 border-emerald-500/50' : isCompleted ? 'opacity-50 grayscale bg-background border-border/40' : 'bg-background border-border'}
        `}>
          <div className="flex items-center gap-2 overflow-hidden">
            {match.player1 ? (
              <>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={match.player1.photoURL || "/default-avatar.png"} alt="avatar" />
                  <AvatarFallback className="text-[8px]">{match.player1.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className={`text-xs font-bold truncate ${match.winnerUid === match.player1.uid ? 'text-emerald-500' : ''}`}>{match.player1.displayName}</span>
              </>
            ) : <span className="text-xs text-muted-foreground italic">TBD</span>}
          </div>
          {match.player1?.wpm && <span className="text-[10px] font-mono text-muted-foreground">{match.player1.wpm}</span>}
        </div>

        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-muted border border-border/50 text-[8px] font-black italic text-muted-foreground z-10 shadow-sm">
           VS
        </div>

        {/* Player 2 */}
        <div className={`flex items-center justify-between p-2 rounded border transition-colors
          ${match.winnerUid === match.player2?.uid ? 'bg-emerald-500/10 border-emerald-500/50' : isCompleted ? 'opacity-50 grayscale bg-background border-border/40' : 'bg-background border-border'}
        `}>
          <div className="flex items-center gap-2 overflow-hidden">
            {match.player2 ? (
              <>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={match.player2.photoURL || "/default-avatar.png"} alt="avatar" />
                  <AvatarFallback className="text-[8px]">{match.player2.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className={`text-xs font-bold truncate ${match.winnerUid === match.player2.uid ? 'text-emerald-500' : ''}`}>{match.player2.displayName}</span>
              </>
            ) : <span className="text-xs text-muted-foreground italic">TBD</span>}
          </div>
          {match.player2?.wpm && <span className="text-[10px] font-mono text-muted-foreground">{match.player2.wpm}</span>}
        </div>

        {/* Action Button (Spectate / Join) */}
        {(isLive || (match.player1 && match.player2 && !isCompleted)) && (
          <Button 
            size="sm" 
            variant={isLive ? "default" : "secondary"}
            className="w-full h-7 text-[10px] mt-1 font-bold"
            onClick={async () => {
              if (!user) return;
              if (match.player1?.uid === user.uid || match.player2?.uid === user.uid) {
                // If user is playing in this match, create or join the match room
                try {
                  toast.loading("Entering Match Lobby...", { id: "join_match" });
                  const roomId = await joinTournamentMatch(tourney.id, stage, match.id, match, {
                    uid: user.uid,
                    displayName: user.displayName || "Anonymous",
                    photoURL: user.photoURL || ""
                  });
                  toast.dismiss("join_match");
                  router.push(`/multiplayer?room=${roomId}&tournamentId=${tourney.id}&stage=${stage}&matchId=${match.id}`);
                } catch {
                  toast.dismiss("join_match");
                  toast.error("Failed to join match");
                }
              } else {
                // Spectating Mode
                if (!match.roomId) {
                  toast.error("Match hasn't started yet");
                  return;
                }
                toast.info("Entering Spectator Mode...");
                router.push(`/multiplayer?room=${match.roomId}&spectate=true&tournamentId=${tourney.id}`);
              }
            }}
          >
            {match.player1?.uid === user?.uid || match.player2?.uid === user?.uid ? (
              <><Sword className="w-3 h-3 mr-1"/> Enter Waiting Room</>
            ) : (
              <><Play className="w-3 h-3 mr-1"/> Spectate</>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 min-h-screen">
      
      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tournament")}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{tourney.title}</h1>
             <Badge className={tourney.status === "active" ? "bg-emerald-500 animate-pulse" : ""}>
               {tourney.status.toUpperCase()}
             </Badge>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-4 mt-1">
             <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Starts: {format(tourney.startTime, "PP p")}</span>
             <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Players: {tourney.participants.length} / {tourney.maxPlayers}</span>
             <span className="flex items-center gap-1 text-amber-500 font-bold"><Trophy className="w-3.5 h-3.5"/> {tourney.prizePool}</span>
          </p>
        </div>
      </div>

      {/* Admin Quick Action (Generates Bracket if full/manual) */}
      {user && tourney.status === "registration" && (
        <Card className="bg-muted/30 border-dashed border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Tournament is currently in Registration phase.</p>
              <p className="text-xs text-muted-foreground">Once ready, the Admin must generate the bracket to begin.</p>
            </div>
            <Button onClick={handleGenerateBracket} variant="outline" className="border-primary/50 text-primary">
              (Admin) Generate Bracket
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bracket View */}
      <div className="flex-1 bg-muted/10 border border-border/40 rounded-2xl p-4 sm:p-8 overflow-x-auto">
        
        {!bracket ? (
           <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
             <Trophy className="w-16 h-16" />
             <p className="font-mono">Bracket has not been generated yet.</p>
           </div>
        ) : (
           <div className="flex justify-between gap-12 min-w-[800px]">
             
             {/* Quarter Finals Column */}
             <div className="flex flex-col gap-4 flex-1">
               <h3 className="text-center font-black text-sm uppercase tracking-widest text-muted-foreground mb-4 border-b border-border/50 pb-2">Quarter Finals</h3>
               <div className="flex flex-col justify-around flex-1 gap-6">
                 {renderMatch("Match A", bracket.quarterFinals?.qf1, tourney.rundown.quarterFinals, "quarterFinals")}
                 {renderMatch("Match B", bracket.quarterFinals?.qf2, tourney.rundown.quarterFinals, "quarterFinals")}
                 {renderMatch("Match C", bracket.quarterFinals?.qf3, tourney.rundown.quarterFinals, "quarterFinals")}
                 {renderMatch("Match D", bracket.quarterFinals?.qf4, tourney.rundown.quarterFinals, "quarterFinals")}
               </div>
             </div>

             {/* Connector Paths Placeholder */}
             <div className="w-8 flex flex-col hidden md:flex">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  {/* Visually connecting QF to SF. Exact SVG coords depend on fixed heights, skipped for simplicity */}
                </svg>
             </div>

             {/* Semi Finals Column */}
             <div className="flex flex-col gap-4 flex-1">
               <h3 className="text-center font-black text-sm uppercase tracking-widest text-amber-500/70 mb-4 border-b border-border/50 pb-2">Semi Finals</h3>
               <div className="flex flex-col justify-around flex-1 pt-12 pb-12">
                 {renderMatch("Semi 1", bracket.semiFinals?.sf1, tourney.rundown.semiFinals, "semiFinals")}
                 {renderMatch("Semi 2", bracket.semiFinals?.sf2, tourney.rundown.semiFinals, "semiFinals")}
               </div>
             </div>

             <div className="w-8 flex flex-col hidden md:flex"></div>

             {/* Finals Column */}
             <div className="flex flex-col gap-4 flex-1">
               <h3 className="text-center font-black text-sm uppercase tracking-widest text-amber-500 mb-4 border-b border-border/50 pb-2">Grand Finals</h3>
               <div className="flex flex-col justify-center flex-1">
                 {renderMatch("Championship", bracket.finals?.f1, tourney.rundown.finals, "finals")}
               </div>
             </div>

           </div>
        )}

      </div>
      
    </div>
  );
}
