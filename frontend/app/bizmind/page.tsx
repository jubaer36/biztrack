"use client";

import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Zap, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

const AIAssistantPage = () => {
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
              <h1 className="text-2xl font-bold text-foreground">AI Business Assistant</h1>
              <p className="text-sm text-muted-foreground">Natural language business insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Quick Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "What's my revenue trend?"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Show top 10 customers"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Predict next month sales"
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Suggest cost savings"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Optimize inventory"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Find profit opportunities"
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Compare to last year"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Why sales dropped?"
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                  "Best selling products"
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <AIAssistant />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Your AI assistant interaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">Revenue Analysis Request</p>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                <p className="text-sm text-muted-foreground">"Compare my revenue this month vs last month by category"</p>
              </div>
              
              <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">Inventory Optimization</p>
                  <span className="text-xs text-muted-foreground">Yesterday</span>
                </div>
                <p className="text-sm text-muted-foreground">"Which products should I reorder this week?"</p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">Customer Insights</p>
                  <span className="text-xs text-muted-foreground">2 days ago</span>
                </div>
                <p className="text-sm text-muted-foreground">"Show me customers who haven't purchased in 60 days"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AIAssistantPage;
