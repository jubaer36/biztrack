"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, LineChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface CashFlowPrediction {
  prediction_date: string;
  predicted_cash_in: number;
  predicted_cash_out: number;
  predicted_net_cash: number;
  confidence_score: number;
}

interface CashFlowPredictionProps {
  predictions?: CashFlowPrediction[];
}

// Default sample data for when no predictions are provided
const defaultData = [
  { month: "Jan", income: 85000, expenses: 62000, net: 23000, confidence: 85 },
  { month: "Feb", income: 92000, expenses: 68000, net: 24000, confidence: 82 },
  { month: "Mar", income: 88000, expenses: 65000, net: 23000, confidence: 88 },
  { month: "Apr", income: 98000, expenses: 71000, net: 27000, confidence: 79 },
  { month: "May", income: 105000, expenses: 76000, net: 29000, confidence: 86 },
  { month: "Jun", income: 112000, expenses: 79000, net: 33000, confidence: 83 },
];

export const CashFlowPrediction = ({ predictions }: CashFlowPredictionProps) => {
  // Transform predictions data for chart
  const chartData = predictions && predictions.length > 0 ?
    predictions.slice(0, 30).map((pred, index) => {
      const date = new Date(pred.prediction_date);
      const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

      return {
        day: dayLabel,
        income: pred.predicted_cash_in,
        expenses: pred.predicted_cash_out,
        net: pred.predicted_net_cash,
        confidence: pred.confidence_score
      };
    }) : defaultData;

  // Calculate summary stats
  const avgConfidence = chartData.reduce((sum, item) => sum + (item.confidence || 0), 0) / Math.max(chartData.length, 1);
  const totalProjectedIncome = chartData.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalProjectedExpenses = chartData.reduce((sum, item) => sum + (item.expenses || 0), 0);
  const totalProjectedNet = totalProjectedIncome - totalProjectedExpenses;

  // Risk assessment based on net cash flow trend
  const getRiskLevel = () => {
    const negativeFlows = chartData.filter(item => (item.net || 0) < 0).length;
    const riskPercentage = (negativeFlows / chartData.length) * 100;

    if (riskPercentage > 50) return { level: 'High', color: 'destructive' };
    if (riskPercentage > 25) return { level: 'Medium', color: 'default' };
    return { level: 'Low', color: 'secondary' };
  };

  const risk = getRiskLevel();
  const isRealData = predictions && predictions.length > 0;

  return (
    <Card className="relative border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Cash Flow Intelligence
              {isRealData && <Badge variant="secondary">AI-Powered</Badge>}
            </CardTitle>
            <CardDescription>
              {isRealData ?
                `AI-predicted cash position with ${Math.round(avgConfidence)}% confidence` :
                "Sample cash flow analysis - generate predictions for real data"
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={risk.color as any}>
              {risk.level} Risk
            </Badge>
            {isRealData && (
              <Badge variant="outline">
                {chartData.length} days forecast
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {isRealData ? (
            <LineChart data={chartData}>
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string) => {
                  const label = name === 'income' ? 'Cash In' :
                    name === 'expenses' ? 'Cash Out' :
                      name === 'net' ? 'Net Cash' : 'Confidence';
                  return [`৳${value.toLocaleString()}`, label];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--success))"
                name="Predicted Cash In"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                name="Predicted Cash Out"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="hsl(var(--primary))"
                name="Net Cash Flow"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
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
          )}
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs text-muted-foreground">
              {isRealData ? 'Projected Income' : 'Avg Monthly Income'}
            </p>
            <p className="text-lg font-bold text-success">
              ৳{(isRealData ? totalProjectedIncome / 1000 : 98).toFixed(0)}k
            </p>
          </div>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">
              {isRealData ? 'Projected Expenses' : 'Avg Monthly Expenses'}
            </p>
            <p className="text-lg font-bold text-destructive">
              ৳{(isRealData ? totalProjectedExpenses / 1000 : 70).toFixed(0)}k
            </p>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              {isRealData ? 'Net Projection' : 'Avg Net Cash'}
            </p>
            <p className="text-lg font-bold text-primary">
              ৳{(isRealData ? totalProjectedNet / 1000 : 28).toFixed(0)}k
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground">
              {isRealData ? 'AI Confidence' : 'Prediction Quality'}
            </p>
            <p className="text-lg font-bold">
              {Math.round(isRealData ? avgConfidence : 85)}%
            </p>
          </div>
        </div>

        {isRealData && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-semibold text-sm mb-2">AI Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">
                  <strong>Cash Flow Trend:</strong> {totalProjectedNet > 0 ? 'Positive' : 'Negative'}
                  ({totalProjectedNet > 0 ? '+' : ''}৳{(totalProjectedNet / 1000).toFixed(0)}k projected)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  <strong>Risk Assessment:</strong> {risk.level} risk based on flow patterns
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
