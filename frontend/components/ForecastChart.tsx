"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const data = [
  { month: "Jan", actual: 45000, forecast: 42000, confidence: "92%" },
  { month: "Feb", actual: 52000, forecast: 50000, confidence: "89%" },
  { month: "Mar", actual: 48000, forecast: 49000, confidence: "91%" },
  { month: "Apr", actual: 61000, forecast: 58000, confidence: "88%" },
  { month: "May", actual: 55000, forecast: 63000, confidence: "85%" },
  { month: "Jun", actual: null, forecast: 67000, confidence: "83%" },
  { month: "Jul", actual: null, forecast: 72000, confidence: "80%" },
];

export const ForecastChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Demand Forecast</CardTitle>
        <CardDescription>
          Predictions powered by historical data, weather, festivals, and market trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="Actual Sales"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--accent))", r: 4 }}
              name="AI Forecast"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-sm font-medium text-accent-foreground">
            📊 Next Month Prediction: ৳67,000 (83% confidence)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Factors: Upcoming Eid festival (+15%), favorable weather (+5%), market trends (+3%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
