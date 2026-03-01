"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { listenToTournaments, Tournament, joinTournament, mockCreateUpcomingTournament } from "@/lib/tournament";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trophy, Clock, Users, Calendar, ArrowRight, ShieldAlert, Plus } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { createTournament } from "@/lib/tournament";

export default function TournamentHub() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("Tournament");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrize, setNewPrize] = useState("");
  const [newMaxPlayers, setNewMaxPlayers] = useState("8");
  const [newStartTime, setNewStartTime] = useState("");

  useEffect(() => {
    const unsub = listenToTournaments((data) => {
      setTournaments(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleJoin = async (t: Tournament) => {
    if (!user) {
      toast.error("Please sign in to join a tournament");
      return;
    }
    if (t.participants.length >= t.maxPlayers) {
      toast.error("Tournament is full!");
      return;
    }
    if (t.participants.some(p => p.uid === user.uid)) {
      toast.info("You are already registered.");
      router.push(`/tournament/${t.id}`);
      return;
    }

    try {
      await joinTournament(t.id, {
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || ""
      });
      toast.success("Successfully registered for the tournament!");
      router.push(`/tournament/${t.id}`);
    } catch {
      toast.error("Failed to join tournament");
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newPrize || !newStartTime) return;
    
    try {
      const ms = new Date(newStartTime).getTime();
      await createTournament({
        title: newTitle,
        description: newDesc,
        status: "registration",
        startTime: ms,
        maxPlayers: parseInt(newMaxPlayers, 10),
        participants: [],
        prizePool: newPrize,
        rundown: {
          quarterFinals: ms,
          semiFinals: ms + 600000,
          finals: ms + 1200000
        }
      });
      toast.success("Tournament created successfully!");
      setIsCreateOpen(false);
      setNewTitle(""); setNewDesc(""); setNewPrize(""); setNewStartTime("");
    } catch {
      toast.error("Failed to create tournament");
    }
  };

  const handleAdminMock = async () => {
    await mockCreateUpcomingTournament();
    toast.success("Created mock upcoming tournament");
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading tournaments...</div>;

  const active = tournaments.filter(t => t.status === "active");
  const upcoming = tournaments.filter(t => t.status === "registration");
  const past = tournaments.filter(t => t.status === "completed");

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col gap-10">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
           <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter">{t("title").split(' ')[0]} <span className="text-amber-500">{t("title").split(' ').slice(1).join(' ')}</span></h1>
        <p className="text-lg text-muted-foreground w-full max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
        
        {user && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold gap-2">
                  <Plus className="w-4 h-4"/> {t("createBtn")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateTournament}>
                  <DialogHeader>
                    <DialogTitle>{t("createTitle")}</DialogTitle>
                    <DialogDescription>{t("createDesc")}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium leading-none">{t("formName")}</label>
                      <Input id="title" required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="desc" className="text-sm font-medium leading-none">{t("formDesc")}</label>
                      <Input id="desc" required value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="max" className="text-sm font-medium leading-none">{t("formPlayers")}</label>
                        <Input id="max" type="number" min="8" step="8" required value={newMaxPlayers} onChange={e => setNewMaxPlayers(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="prize" className="text-sm font-medium leading-none">{t("formPrize")}</label>
                        <Input id="prize" required value={newPrize} onChange={e => setNewPrize(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="start" className="text-sm font-medium leading-none">{t("formStart")}</label>
                      <Input id="start" type="datetime-local" required value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full">{t("createSubmit")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {tournaments.length === 0 && (
              <Button variant="outline" onClick={handleAdminMock}><ShieldAlert className="w-4 h-4 mr-2" /> {t("generateMockBtn")}</Button>
            )}
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="text-primary"/> {t("upcoming")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {upcoming.map(tourney => (
              <Card key={tourney.id} className="relative overflow-hidden border-primary/20 bg-background/50 hover:bg-background/80 transition-all border-l-4 border-l-primary shadow-lg group">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5 group-hover:scale-110 transition-transform">
                  <Trophy className="w-32 h-32" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{tourney.title}</CardTitle>
                      <CardDescription className="mt-1">{tourney.description}</CardDescription>
                    </div>
                    <Badge variant="default" className="bg-primary/20 text-primary uppercase text-[10px] tracking-widest">{t("statusRegistration")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> {t("startsAt")}</span>
                      <span className="font-mono font-bold text-base">{format(tourney.startTime, "MMM d, HH:mm")}</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider flex items-center gap-1"><Users className="w-3 h-3"/> {t("slots")}</span>
                      <span className="font-mono font-bold text-base">{tourney.participants.length} <span className="opacity-50 text-sm">/ {tourney.maxPlayers}</span></span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-amber-500 text-xs uppercase font-bold tracking-wider flex items-center gap-1"><Trophy className="w-3 h-3"/> {t("prize")}</span>
                      <span className="font-bold text-sm text-foreground/80 line-clamp-1">{tourney.prizePool}</span>
                    </div>
                  </div>
                  
                  {/* Rundown preview */}
                   <div className="flex items-center justify-between opacity-60 text-xs font-mono">
                     <span>{t("qf")}: {format(tourney.rundown.quarterFinals, "HH:mm")}</span>
                     <ArrowRight className="w-3 h-3"/>
                     <span>{t("sf")}: {format(tourney.rundown.semiFinals, "HH:mm")}</span>
                     <ArrowRight className="w-3 h-3"/>
                     <span>{t("gf")}: {format(tourney.rundown.finals, "HH:mm")}</span>
                   </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/30 pt-4">
                  {tourney.participants.some(p => p.uid === user?.uid) ? (
                    <Button variant="secondary" className="w-full font-bold" onClick={() => router.push(`/tournament/${tourney.id}`)}>
                      {t("registeredBtn")}
                    </Button>
                  ) : tourney.participants.length >= tourney.maxPlayers ? (
                    <Button disabled className="w-full opacity-50">{t("fullBtn")}</Button>
                  ) : (
                    <Button onClick={() => handleJoin(tourney)} className="w-full font-bold bg-primary hover:bg-primary/90">
                      {t("registerBtn")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="text-emerald-500 animate-pulse"/> {t("live")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {active.map(tData => (
              <Card key={tData.id} className="border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CardHeader>
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-lg">{tData.title}</CardTitle>
                     <Badge className="bg-emerald-500/20 text-emerald-500 uppercase tracking-widest text-[10px] animate-pulse">{t("statusActive")}</Badge>
                   </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{tData.participants.length} Players currently competing in the brackets.</p>
                  <Button variant="outline" className="w-full font-bold border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors" onClick={() => router.push(`/tournament/${tData.id}`)}>
                    {t("spectateBtn")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-4 opacity-70">
          <h2 className="text-2xl font-bold flex items-center gap-2">{t("past")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {past.map(tData => (
              <Card key={tData.id} className="bg-muted/20">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-base">{tData.title}</CardTitle>
                   </div>
                   <CardDescription className="text-xs">{format(tData.startTime, "MMM d, yyyy")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => router.push(`/tournament/${tData.id}`)}>
                    {t("viewBracketBtn")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {tournaments.length === 0 && (
        <div className="text-center py-20 px-4 bg-muted/20 border border-border/30 rounded-2xl flex flex-col items-center gap-2">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mb-2"/>
          <h3 className="text-xl font-bold text-foreground/70">{t("noMatchLabel")}</h3>
          <p className="text-sm text-muted-foreground">{t("noMatchDesc")}</p>
        </div>
      )}
      
    </div>
  );
}
