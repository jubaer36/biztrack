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
} from "lucide-react";
import { useRouter } from "next/navigation";

export const QuickActions = () => {
  const router = useRouter();

  const actions = [
    {
      icon: DollarSign,
      label: "Record Sale",
      description: "Quick sale entry",
      variant: "default",
      action: () => router.push("/sales"),
    },
    {
      icon: TrendingDown,
      label: "Add Expense",
      description: "Track spending",
      variant: "secondary",
      action: () => router.push("/expenses"), // Placeholder for future expense page
    },
    {
      icon: Package,
      label: "Update Inventory",
      description: "Stock management",
      variant: "secondary",
      action: () => router.push("/inventory"), // Placeholder for future inventory page
    },
    {
      icon: Plus,
      label: "New Customer",
      description: "Add customer",
      variant: "secondary",
      action: () => router.push("/customers/new"), // Placeholder for future customer page
    },
    {
      icon: ShoppingCart,
      label: "Add to Cart",
      description: "Add items to cart",
      variant: "secondary",
      action: () => router.push("/cart"), // Placeholder for future cart page
    },
    {
      icon: ShoppingCart,
      label: "Record Purchase",
      description: "Purchase from suppliers",
      variant: "secondary",
      action: () => router.push("/purchase-orders"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Record transactions and updates instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={index === 0 ? "default" : "secondary"}
            className="h-auto flex-col items-start p-4 space-y-2"
            onClick={action.action}
          >
            <action.icon className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold text-sm">{action.label}</div>
              <div className="text-xs opacity-70">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
