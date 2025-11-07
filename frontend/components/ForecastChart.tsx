"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { TrendingUp, Sparkles } from "lucide-react";

type Point = { month: string; actual?: number | null; forecast: number; confidence?: string | number };

export const ForecastChart = ({ data = [] as Point[] }: { data?: Point[] }) => {
  const last = data.length ? data[data.length - 1] : undefined;
  const nextUnits = last?.forecast ?? 0;
  const conf = last?.confidence;
  const confText = typeof conf === 'number' ? `${Math.round(conf * 100)}%` : (conf || '');
  return (
    <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-purple-50/30 shadow-xl hover:shadow-2xl transition-all duration-500 group">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              AI Demand Forecast
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Predictions powered by historical data, weather, festivals, and market trends
            </CardDescription>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              fontWeight={600}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              fontWeight={600}
              tickFormatter={(value) => `${Math.round(value as number)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [value.toLocaleString(), ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }} />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="url(#colorActual)"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", r: 5, strokeWidth: 2, stroke: "#fff" }}
              name="Actual Sales"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="url(#colorForecast)"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
              name="AI Forecast"
            />
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200/50 shadow-inner">
          <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Next Period Prediction: <span className="text-purple-600">{nextUnits.toLocaleString()} units</span>{confText ? ` (${confText} confidence)` : ''}
          </p>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            🎯 Model considers trends and seasonality; external signals can be added later
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
