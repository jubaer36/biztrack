"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const data = [
  { month: "Jan", income: 85000, expenses: 62000, net: 23000 },
  { month: "Feb", income: 92000, expenses: 68000, net: 24000 },
  { month: "Mar", income: 88000, expenses: 65000, net: 23000 },
  { month: "Apr", income: 98000, expenses: 71000, net: 27000 },
  { month: "May", income: 105000, expenses: 76000, net: 29000 },
  { month: "Jun", income: 112000, expenses: 79000, net: 33000 },
];

export const CashFlowPrediction = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Intelligence</CardTitle>
        <CardDescription>Predicted cash position with payment behavior analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => [`৳${value.toLocaleString()}`, ""]}
            />
            <Legend />
            <Bar dataKey="income" fill="hsl(var(--success))" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" fill="hsl(var(--primary))" name="Net Cash" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">Reliable Payers</p>
            <p className="text-lg font-bold text-success">78%</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">Credit Risk</p>
            <p className="text-lg font-bold text-warning-foreground">15%</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Avg Collection</p>
            <p className="text-lg font-bold text-primary">18 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
