"use client";

import { useMemo } from "react";
import { UserProfile } from "@/lib/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useTheme } from "next-themes";

interface ProgressChartProps {
  history?: UserProfile["wpmHistory"];
}

export function ProgressChart({ history }: ProgressChartProps) {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map((point) => ({
      ...point,
      displayDate: format(new Date(point.date), "MMM d, HH:mm"),
    }));
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-background/50 rounded-xl border border-border/40 text-muted-foreground font-medium">
        Not enough data yet. Complete more tests!
      </div>
    );
  }

  const primaryColor = theme === "light" ? "#18181b" : "#fafafa";

  return (
    <div className="w-full h-[300px] bg-background/50 rounded-xl border border-border/40 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            dataKey="wpm" 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <RechartsTooltip 
            contentStyle={{ 
              borderRadius: "0.5rem", 
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              fontWeight: 600,
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", marginBottom: "0.25rem" }}
            itemStyle={{ color: "hsl(var(--primary))", fontSize: "1.25rem", fontWeight: 800 }}
          />
          <Line 
            type="monotone" 
            dataKey="wpm" 
            stroke={primaryColor} 
            strokeWidth={3}
            dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
