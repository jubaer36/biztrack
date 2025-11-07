"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

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
    <Card className="relative border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <DollarSign className="h-6 w-6 text-emerald-600" />
              Cash Flow Intelligence
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Predicted cash position with payment behavior analysis
            </CardDescription>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
              tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [`৳${value.toLocaleString()}`, ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }} />
            <Bar dataKey="income" fill="url(#colorIncome)" name="Income" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="url(#colorExpenses)" name="Expenses" radius={[8, 8, 0, 0]} />
            <Bar dataKey="net" fill="url(#colorNet)" name="Net Cash" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reliable Payers</p>
            <p className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-1">78%</p>
          </div>
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <AlertCircle className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Credit Risk</p>
            <p className="text-2xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent mt-1">15%</p>
          </div>
          <div className="group relative p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Avg Collection</p>
            <p className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">18 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
