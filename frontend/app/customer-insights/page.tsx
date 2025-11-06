"use client";

import { CustomerInsights } from "@/components/CustomerInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Star, TrendingDown, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

const CustomerInsightsPage = () => {
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
              <h1 className="text-2xl font-bold text-foreground">Customer Intelligence</h1>
              <p className="text-sm text-muted-foreground">RFM segmentation & insights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Champions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-success" />
                <div className="text-2xl font-bold text-foreground">28</div>
              </div>
              <p className="text-xs text-success mt-1">Top customers</p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loyal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">45</div>
              </div>
              <p className="text-xs text-primary mt-1">Regular buyers</p>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-warning" />
                <div className="text-2xl font-bold text-foreground">18</div>
              </div>
              <p className="text-xs text-warning mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <div className="text-2xl font-bold text-foreground">142</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <CustomerInsights />
        
        <Card>
          <CardHeader>
            <CardTitle>Automated Engagement Campaigns</CardTitle>
            <CardDescription>AI-powered customer retention strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="p-2 rounded-lg bg-success/10">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">VIP Appreciation Program</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Targeting 28 champion customers with exclusive offers</p>
                  <div className="flex gap-2">
                    <Button size="sm">View Details</Button>
                    <Button size="sm" variant="outline">Edit Campaign</Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="p-2 rounded-lg bg-warning/10">
                  <TrendingDown className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">Win-Back Campaign</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">Scheduled</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Re-engage 18 at-risk customers with personalized discounts</p>
                  <div className="flex gap-2">
                    <Button size="sm">Launch Now</Button>
                    <Button size="sm" variant="outline">Customize</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">Product Recommendations</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">Draft</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Send personalized product suggestions to loyal customers</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Create Campaign</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerInsightsPage;
