"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard, ScoreEntry } from "@/lib/firestore";
import { formatDistanceToNow } from "date-fns";
import { Trophy, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type TF = "all" | "week" | "today";
const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const [tf, setTf] = useState<TF>("all");
  const [df, setDf] = useState("all");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Leaderboard");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setScores(await getLeaderboard(tf, df === "all" ? "all" : parseInt(df)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tf, df]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12 space-y-8">

      <Card className="border-border/40 shadow-xl bg-background/60 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-border/40 bg-muted/10 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-primary">
            <Trophy className="w-8 h-8" />
            <CardTitle className="text-3xl font-black tracking-tight">{t("title")}</CardTitle>
          </div>
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="w-full sm:w-auto h-11 px-6 rounded-full font-medium hidden sm:flex shadow-sm hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 lg:p-8 space-y-8">

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4 sm:px-0 pt-6 sm:pt-0">
            <Tabs value={tf} onValueChange={(v) => setTf(v as TF)} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-3 md:flex h-12 rounded-xl p-1 bg-muted/50">
                <TabsTrigger value="all" className="rounded-lg font-semibold">{t("allTime")}</TabsTrigger>
                <TabsTrigger value="week" className="rounded-lg font-semibold">{t("thisWeek")}</TabsTrigger>
                <TabsTrigger value="today" className="rounded-lg font-semibold">{t("today")}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3 w-full md:w-auto bg-muted/30 p-1.5 rounded-xl border border-border/50">
              <span className="text-sm font-semibold text-muted-foreground ml-3 hidden md:inline">Test Mode:</span>
              <Select value={df} onValueChange={setDf}>
                <SelectTrigger className="w-full md:w-[180px] h-9 border-transparent bg-background shadow-sm rounded-lg font-medium">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="15">15 Seconds</SelectItem>
                  <SelectItem value="30">30 Seconds</SelectItem>
                  <SelectItem value="60">60 Seconds</SelectItem>
                  <SelectItem value="120">120 Seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border-t sm:border border-border/40 sm:rounded-2xl overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-20 text-center font-bold h-14">{t("tableRank")}</TableHead>
                  <TableHead className="font-bold h-14">{t("tableUser")}</TableHead>
                  <TableHead className="text-right font-bold h-14">{t("tableWpm")}</TableHead>
                  <TableHead className="text-right font-bold h-14 hidden sm:table-cell">{t("tableAccuracy")}</TableHead>
                  <TableHead className="text-right font-bold h-14 hidden md:table-cell">Mode</TableHead>
                  <TableHead className="text-right font-bold h-14 hidden lg:table-cell">{t("tableDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell className="text-center h-20"><div className="w-8 h-8 mx-auto rounded-full bg-muted animate-pulse" /></TableCell>
                      <TableCell className="h-20"><div className="w-40 h-5 rounded bg-muted animate-pulse" /></TableCell>
                      <TableCell className="text-right h-20"><div className="w-16 h-6 ml-auto rounded bg-muted animate-pulse" /></TableCell>
                      <TableCell className="text-right h-20 hidden sm:table-cell"><div className="w-12 h-5 ml-auto rounded bg-muted animate-pulse" /></TableCell>
                      <TableCell className="text-right h-20 hidden md:table-cell"><div className="w-14 h-6 ml-auto rounded-full bg-muted animate-pulse" /></TableCell>
                      <TableCell className="text-right h-20 hidden lg:table-cell"><div className="w-24 h-4 ml-auto rounded bg-muted animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : scores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                          <Trophy className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-medium text-lg">No records found for this timeframe.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scores.map((s, i) => {
                    const rank = i + 1;
                    const top = rank <= 3;
                    return (
                      <TableRow key={s.id} className={`h-20 border-border/40 transition-colors ${top ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.06]" : "hover:bg-muted/30"}`}>
                        <TableCell className="text-center font-medium">
                          {MEDAL[rank] ? <span className="text-2xl filter drop-shadow-sm">{MEDAL[rank]}</span> : <span className="text-muted-foreground font-mono">{rank}</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10 border shadow-sm">
                              <AvatarImage src={s.photoURL} alt={s.displayName || "User Avatar"} />
                              <AvatarFallback className="text-xs font-bold bg-muted">
                                {(s.displayName || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`font-bold text-base ${top ? 'text-primary' : 'text-foreground'}`}>
                              {s.displayName}
                            </span>
                            {rank === 1 && <Badge variant="default" className="ml-2 bg-amber-500 hover:bg-amber-600 font-bold shadow-sm hidden md:inline-flex">Champion 🏆</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-xl sm:text-2xl font-black text-primary tabular-nums tracking-tighter">
                            {s.wpm}
                          </span>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <span className="font-mono text-lg font-bold tabular-nums text-muted-foreground">
                            {s.accuracy}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          <Badge variant="outline" className="font-mono font-medium rounded-md px-2 py-1 shadow-sm bg-background border-border/50">{s.mode}</Badge>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {s.createdAt ? formatDistanceToNow(s.createdAt.toDate(), { addSuffix: true }) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile refresh button */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl sm:hidden shadow-sm"
        onClick={load}
        disabled={loading}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh Leaderboard
      </Button>
    </div>
  );
}
