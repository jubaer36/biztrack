"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertCircle, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const segments = [
  { name: "Champions", count: 45, value: "৳3.2L", color: "success", percent: 35 },
  { name: "Potential Loyalists", count: 62, value: "৳2.8L", color: "primary", percent: 25 },
  { name: "At Risk", count: 28, value: "৳1.5L", color: "warning", percent: 20 },
  { name: "Lost", count: 15, value: "৳0.8L", color: "destructive", percent: 12 }
];

const insights = [
  {
    icon: Star,
    title: "Top Customers",
    description: "15 customers generate 60% of revenue",
    action: "Send loyalty rewards"
  },
  {
    icon: AlertCircle,
    title: "Churn Risk",
    description: "8 customers haven't purchased in 60+ days",
    action: "Re-engagement campaign active"
  },
  {
    icon: TrendingUp,
    title: "Growth Opportunity",
    description: "32 customers showing increased frequency",
    action: "Upsell premium products"
  }
];

export const CustomerInsights = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Intelligence</CardTitle>
        <CardDescription>RFM segmentation with automated retention strategies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {segments.map((segment, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={segment.color as any}>{segment.name}</Badge>
                  <span className="text-muted-foreground">{segment.count} customers</span>
                </div>
                <span className="font-semibold">{segment.value}</span>
              </div>
              <Progress value={segment.percent} className="h-2" />
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <insight.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                <p className="text-xs font-medium text-accent">{insight.action}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
