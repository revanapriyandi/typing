"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserProfile, getUserScores, UserProfile, ScoreEntry } from "@/lib/firestore";
import { ACHIEVEMENTS, RARITY_COLORS } from "@/lib/achievements";
import { formatDistanceToNow } from "date-fns";
import { Keyboard, Clock, Target, Zap, Medal, LineChart as ChartIcon, Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { Heatmap } from "@/components/Heatmap";
import { ProgressChart } from "@/components/ProgressChart";

function StatCard({ value, label, icon: Icon }: { value: string | number; label: string, icon?: React.ElementType }) {
  return (
    <Card className="flex flex-col items-center justify-center p-4 min-w-[120px] shadow-sm">
      {Icon && <Icon className="w-5 h-5 text-muted-foreground mb-2" />}
      <span className="font-mono font-bold text-3xl tracking-tighter text-foreground">{value}</span>
      <span className="text-xs uppercase tracking-wider mt-1 text-muted-foreground font-medium">{label}</span>
    </Card>
  );
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Profile");

  useEffect(() => {
    if (!uid) return;
    Promise.all([getUserProfile(uid), getUserScores(uid)]).then(([p, s]) => {
      setProfile(p);
      setScores(s);
      setLoading(false);
    });
  }, [uid]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <UserNotFoundIcon className="w-16 h-16 text-muted-foreground/50" />
      <p className="text-lg text-muted-foreground font-medium">{t("notFound")}</p>
    </div>
  );

  const unlocked = new Set(profile.achievements || []);
  const avgWpm = scores.length ? Math.round(scores.reduce((a, s) => a + s.wpm, 0) / scores.length) : 0;
  const totalMin = Math.round((profile.totalTime || 0) / 60);

  return (
    <TooltipProvider>
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* ── Header section ── */}
        <div className="flex flex-col xl:flex-row gap-8 items-stretch">
          <Card className="w-full xl:w-[400px] border-border/40 shadow-xl bg-background/60 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center rounded-2xl shrink-0">
            <Avatar className="w-40 h-40 ring-4 ring-background shadow-lg mb-6 group transition-transform hover:scale-105">
              <AvatarImage src={profile.photoURL} alt={profile.displayName || "Avatar"} className="object-cover" />
              <AvatarFallback className="text-5xl font-black bg-muted text-foreground">
                {(profile.displayName || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-black tracking-tight">{profile.displayName}</h1>
            <p className="text-muted-foreground mt-2 text-base font-medium flex items-center gap-1.5">
              <Target className="w-4 h-4" /> {profile.country || "Earth"}
            </p>
            <Badge variant="secondary" className="mt-6 px-4 py-1.5 text-sm font-semibold rounded-full bg-primary/5 text-primary">
              <Medal className="w-4 h-4 mr-2 inline-flex" />
              {unlocked.size} / {ACHIEVEMENTS.length} {t("achievementsCount")}
            </Badge>
          </Card>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-8 min-h-[300px]">
            <StatCard value={profile.bestWpm || 0} label={t("bestWpm")} icon={Zap} />
            <StatCard value={avgWpm} label={t("avgWpm")} icon={Target} />
            <StatCard value={profile.totalTests || 0} label={t("testsTaken")} icon={Keyboard} />
            <StatCard value={`${totalMin}m`} label={t("timeTyped")} icon={Clock} />
          </div>
        </div>

        {/* ── Achievements ── */}
        <Card className="border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <Medal className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-bold">{t("galleryTitle")}</CardTitle>
            </div>
            <CardDescription className="text-base font-medium mt-1">{t("galleryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {ACHIEVEMENTS.map((ach) => {
                const is = unlocked.has(ach.id);
                // Extract border color class or use default
                const borderColor = RARITY_COLORS[ach.rarity]?.split(' ').find(c => c.startsWith('border-')) || 'border-border';
                
                return (
                  <Tooltip key={ach.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 ${!is ? "opacity-30 grayscale hover:opacity-50" : `hover:-translate-y-1 hover:shadow-lg cursor-pointer ${borderColor}`}`}
                      >
                        <span className="text-4xl mb-3 filter drop-shadow-md">{ach.icon}</span>
                        <span className="text-xs text-center leading-tight font-bold text-foreground line-clamp-2 w-full">
                          {ach.name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {is && (
                      <TooltipContent className="max-w-[240px] p-5 space-y-3 rounded-xl shadow-xl">
                        <p className="font-bold text-base leading-tight">{ach.name}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{ach.description}</p>
                        <Badge variant="outline" className={`mt-3 text-[10px] uppercase font-bold tracking-widest ${RARITY_COLORS[ach.rarity]} border-current/20 bg-current/5`}>
                          {ach.rarity}
                        </Badge>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Advanced Analytics ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10 px-8 py-6">
              <div className="flex items-center gap-3">
                <ChartIcon className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl font-bold">WPM Progression</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <ProgressChart history={profile.wpmHistory} />
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10 px-8 py-6">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl font-bold">Keystroke Heatmap</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <Heatmap heatmapData={profile.heatmap} />
            </CardContent>
          </Card>
        </div>

        {/* ── Score History ── */}
        <Card className="border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/10 px-8 py-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-bold">{t("recentTests")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-2">
            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <Keyboard className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-lg font-medium">{t("noHistory")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {scores.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:px-8 hover:bg-muted/20 transition-colors gap-6"
                  >
                    <div className="flex items-center gap-8 md:gap-12">
                      <div className="flex flex-col">
                        <span className="text-3xl md:text-4xl font-black font-mono text-primary tabular-nums tracking-tighter w-20">{s.wpm}</span>
                        <span className="text-xs uppercase text-muted-foreground font-bold tracking-widest mt-1">WPM</span>
                      </div>
                      <Separator orientation="vertical" className="h-12 hidden sm:block opacity-50" />
                      <div className="flex flex-col">
                        <span className="text-2xl md:text-3xl font-black font-mono tabular-nums text-foreground/80">{s.accuracy}<span className="text-xl md:text-2xl opacity-50">%</span></span>
                        <span className="text-xs uppercase text-muted-foreground font-bold tracking-widest mt-1">{t("accuracy")}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <Badge variant="secondary" className="font-mono text-sm px-3 py-1 bg-muted/50">{s.mode}</Badge>
                      <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-border/50">{s.language}</Badge>
                      <span className="text-sm font-medium text-muted-foreground ml-auto sm:ml-6 whitespace-nowrap">
                        {s.createdAt ? formatDistanceToNow(s.createdAt.toDate(), { addSuffix: true }) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function UserNotFoundIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
