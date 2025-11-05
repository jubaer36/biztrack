"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, Package, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export const QuickActions = () => {
  const actions = [
    {
      icon: DollarSign,
      label: "Record Sale",
      description: "Quick sale entry",
      variant: "default" as const,
      action: () => toast.success("Sale recording opened")
    },
    {
      icon: TrendingDown,
      label: "Add Expense",
      description: "Track spending",
      variant: "secondary" as const,
      action: () => toast.success("Expense form opened")
    },
    {
      icon: Package,
      label: "Update Inventory",
      description: "Stock management",
      variant: "secondary" as const,
      action: () => toast.success("Inventory update opened")
    },
    {
      icon: Plus,
      label: "New Customer",
      description: "Add customer",
      variant: "secondary" as const,
      action: () => toast.success("Customer form opened")
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Record transactions and updates instantly</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
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
