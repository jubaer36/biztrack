"use client";

import { CashFlowPrediction } from "@/components/CashFlowPrediction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const CashFlowPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cash Flow Intelligence</h1>
              <p className="text-sm text-muted-foreground">Real-time cash position monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <div className="text-2xl font-bold text-foreground">৳4.2L</div>
              </div>
              <p className="text-xs text-success mt-1">+12% this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">৳5.1L</div>
              </div>
              <p className="text-xs text-primary mt-1">Strong outlook</p>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <div className="text-2xl font-bold text-foreground">৳1.8L</div>
              </div>
              <p className="text-xs text-warning mt-1">23 invoices pending</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="text-2xl font-bold text-foreground">৳45K</div>
              </div>
              <p className="text-xs text-destructive mt-1">5 customers</p>
            </CardContent>
          </Card>
        </div>

        <CashFlowPrediction />
        
        <Card>
          <CardHeader>
            <CardTitle>Credit Risk Analysis</CardTitle>
            <CardDescription>Customer payment behavior insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Rahman Trading</p>
                  <p className="text-sm text-muted-foreground">Outstanding: ৳25K • 45 days overdue</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive text-destructive-foreground">High Risk</span>
                  <Button size="sm">Follow Up</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border border-warning/20 bg-warning/5">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Karim Store</p>
                  <p className="text-sm text-muted-foreground">Outstanding: ৳42K • 15 days overdue</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning text-warning-foreground">Medium Risk</span>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-success/20 bg-success/5">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Hossain Enterprises</p>
                  <p className="text-sm text-muted-foreground">Always pays within 7 days • Excellent history</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-success text-success-foreground">Low Risk</span>
                  <Button size="sm" variant="outline">Extend Credit</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CashFlowPage;
