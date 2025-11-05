"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Upload, TrendingUp, Package, DollarSign, Users, Bot } from "lucide-react";
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
    <Link href={href}>
      <Card 
        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-border overflow-hidden"
      >
        <div className={cn("h-2 bg-gradient-to-r", gradient)} />
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className={cn("p-3 rounded-lg bg-gradient-to-br", gradient)}>
              <Icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};
