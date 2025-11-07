"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  DollarSign,
  Package,
  TrendingDown,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const QuickActions = () => {
  const router = useRouter();

  const actions = [
    {
      icon: DollarSign,
      label: "Record Sale",
      description: "Quick sale entry",
      gradient: "from-emerald-500 to-teal-500",
      action: () => router.push("/sales"),
    },
    {
      icon: TrendingDown,
      label: "Add Expense",
      description: "Track spending",
      gradient: "from-red-500 to-rose-500",
      action: () => router.push("/expenses"),
    },
    {
      icon: Package,
      label: "Update Inventory",
      description: "Stock management",
      gradient: "from-amber-500 to-orange-500",
      action: () => router.push("/inventory"),
    },
    {
      icon: Plus,
      label: "New Customer",
      description: "Add customer",
      gradient: "from-purple-500 to-pink-500",
      action: () => router.push("/customers/new"),
    },
    {
      icon: ShoppingCart,
      label: "Add to Cart",
      description: "Add items to cart",
      gradient: "from-blue-500 to-cyan-500",
      action: () => router.push("/cart"),
    },
    {
      icon: ShoppingCart,
      label: "Record Purchase",
      description: "Purchase from suppliers",
      gradient: "from-indigo-500 to-purple-500",
      action: () => router.push("/purchase-orders"),
    },
  ];

  return (
    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-slate-50/30 shadow-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Quick Actions
          </CardTitle>
        </div>
        <CardDescription className="text-base text-slate-600">
          Record transactions and updates instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className={cn(
              "group relative h-auto flex-col items-center p-5 space-y-3 overflow-hidden border-2 border-slate-200 hover:border-transparent",
              "bg-white hover:shadow-xl transition-all duration-300 hover:scale-105"
            )}
            onClick={action.action}
          >
            {/* Gradient background on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br",
              action.gradient
            )} />
            
            {/* Icon with gradient background */}
            <div className={cn(
              "relative z-10 p-3 rounded-xl bg-gradient-to-br shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300",
              action.gradient
            )}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            
            {/* Text content */}
            <div className="relative z-10 text-center space-y-1">
              <div className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors duration-300">
                {action.label}
              </div>
              <div className="text-xs text-slate-600 group-hover:text-white/90 transition-colors duration-300">
                {action.description}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
