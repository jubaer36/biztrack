"use client";

import { InventoryAlerts } from "@/components/InventoryAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, AlertTriangle, TrendingDown, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import "./inventory.css";

const InventoryPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">Smart stock optimization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">248</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Need Reorder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="text-2xl font-bold text-foreground">12</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dead Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div className="text-2xl font-bold text-foreground">8</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Optimal Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-success" />
                <div className="text-2xl font-bold text-foreground">228</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <InventoryAlerts />
        
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>AI-generated optimization suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Bundle Opportunity</p>
                  <p className="text-sm text-muted-foreground">Create "Rice + Oil" combo - 78% of customers buy together</p>
                  <Button size="sm" className="mt-2">Create Bundle</Button>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Seasonal Transition</p>
                  <p className="text-sm text-muted-foreground">Start reducing winter items, increase summer products by 25%</p>
                  <Button size="sm" variant="outline" className="mt-2">View Plan</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InventoryPage;
