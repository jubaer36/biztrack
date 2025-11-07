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
  UploadCloudIcon,
  DollarSignIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const QuickActions = () => {
  const router = useRouter();

  const actions = [
    {
      icon: DollarSignIcon,
      label: "My Businesses",
      description: "Manage your businesses",
      gradient: "from-emerald-600 to-teal-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      action: () => router.push("/businesses"),
    },
    {
      icon: DollarSign,
      label: "Record Sale",
      description: "Quick sale entry",
      gradient: "from-emerald-600 to-teal-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      action: () => router.push("/sales"),
    },
    {
      icon: UploadCloudIcon,
      label: "Import Data",
      description: "Upload Excel/CSV files",
      gradient: "from-blue-600 to-indigo-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      action: () => router.push("/businesses"),
    },
    
    {
      icon: Package,
      label: "Update Inventory",
      description: "Stock management",
      gradient: "from-amber-600 to-orange-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      action: () => router.push("/inventory"),
    },
    
    
    {
      icon: ShoppingCart,
      label: "Record Purchase",
      description: "Purchase from suppliers",
      gradient: "from-indigo-600 to-purple-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
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
              "group relative h-auto flex-col items-center p-5 space-y-3 overflow-hidden border-2 border-slate-200 hover:border-slate-300",
              "bg-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            )}
            onClick={action.action}
          >
            {/* Icon with subtle background */}
            <div className={cn(
              "relative p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300",
              action.bgColor
            )}>
              <action.icon className={cn("h-6 w-6", action.iconColor)} />
            </div>
            
            {/* Text content */}
            <div className="text-center space-y-1">
              <div className="font-bold text-sm text-slate-900">
                {action.label}
              </div>
              <div className="text-xs text-slate-600">
                {action.description}
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
