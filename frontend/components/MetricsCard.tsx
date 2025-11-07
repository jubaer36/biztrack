"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
}

export const MetricsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  variant = "default" 
}: MetricsCardProps) => {
  const trendColors = {
    up: "text-emerald-500",
    down: "text-red-500",
    neutral: "text-muted-foreground"
  };

  const variantStyles = {
    default: "border-border/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl hover:shadow-blue-500/10",
    success: "border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-white hover:shadow-xl hover:shadow-emerald-500/20",
    warning: "border-amber-200/50 bg-gradient-to-br from-amber-50 to-white hover:shadow-xl hover:shadow-amber-500/20",
    destructive: "border-red-200/50 bg-gradient-to-br from-red-50 to-white hover:shadow-xl hover:shadow-red-500/20"
  };

  const iconGradients = {
    default: "from-blue-500 to-indigo-500",
    success: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
    destructive: "from-red-500 to-rose-500"
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-1 border-2 group",
      variantStyles[variant]
    )}>
      {/* Gradient accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", iconGradients[variant])} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300", iconGradients[variant])}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          <p className={cn("text-sm font-semibold", trendColors[trend])}>
            {change}
          </p>
        </div>
      </CardContent>
      
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Card>
  );
};
