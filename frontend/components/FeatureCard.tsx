"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Upload, TrendingUp, Package, DollarSign, Users, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: "upload" | "forecast" | "inventory" | "cashflow" | "customers" | "ai";
  href: string;
  gradient: string;
}

const iconMap = {
  upload: Upload,
  forecast: TrendingUp,
  inventory: Package,
  cashflow: DollarSign,
  customers: Users,
  ai: Bot,
};

export const FeatureCard = ({ title, description, icon, href, gradient }: FeatureCardProps) => {
  const Icon = iconMap[icon];

  return (
    <Link href={href} className="group">
      <Card 
        className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-2 border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-slate-50/50 h-full"
      >
        {/* Animated gradient background on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br animate-gradient",
          gradient
        )} />
        
        {/* Top gradient accent */}
        <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", gradient)} />
        
        {/* Sparkle effect */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        </div>

        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "relative p-4 rounded-2xl bg-gradient-to-br shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500",
              gradient
            )}>
              <Icon className="h-7 w-7 text-white" />
              {/* Glow effect */}
              <div className={cn("absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-gradient-to-br", gradient)} />
            </div>
            <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors duration-300">
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-blue-900 group-hover:to-indigo-600 transition-all duration-300">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <CardDescription className="text-base text-slate-600 leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>

        {/* Bottom gradient glow */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          gradient
        )} />
      </Card>
    </Link>
  );
};
