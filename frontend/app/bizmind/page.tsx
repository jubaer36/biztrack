"use client";

import { useEffect, useState } from "react";
import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Zap, TrendingUp, Store, Loader2, RefreshCw, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface VectorStoreStatus {
  exists: boolean;
  businessId: string;
  timestamp?: string;
  recordCounts?: Record<string, number>;
  message?: string;
}

const AIAssistantPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [vectorStoreStatus, setVectorStoreStatus] = useState<VectorStoreStatus | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusiness) {
      checkVectorStoreStatus();
    }
  }, [selectedBusiness]);

  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/businesses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch businesses");

      const data = await response.json();
      setBusinesses(data.businesses || []);
      
      // Auto-select first business if available
      if (data.businesses && data.businesses.length > 0) {
        setSelectedBusiness(data.businesses[0].id);
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setError("Failed to load businesses");
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const checkVectorStoreStatus = async () => {
    if (!selectedBusiness) return;

    try {
      setLoadingStatus(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bizmind/vector-store-status/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVectorStoreStatus(data);
      }
    } catch (err) {
      console.error("Error checking vector store status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const refreshVectorStore = async () => {
    if (!selectedBusiness) return;

    try {
      setRefreshing(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bizmind/refresh-vector-store`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ businessId: selectedBusiness }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to refresh vector store");
      }

      const data = await response.json();
      await checkVectorStoreStatus();
      
      // Show success message
      alert("Vector store refreshed successfully!");
    } catch (err: any) {
      console.error("Error refreshing vector store:", err);
      setError(err.message || "Failed to refresh vector store");
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    // This will be handled by passing the query to AIAssistant
    // For now, we'll just scroll to the chat
    const chatElement = document.querySelector('[data-chat="true"]');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (authLoading || loadingBusinesses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Business Assistant</h1>
                <p className="text-sm text-muted-foreground">Natural language business insights</p>
              </div>
            </div>
            
            {/* Business Selector */}
            {businesses.length > 0 && (
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-muted-foreground" />
                <select
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="px-4 py-2 rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[200px]"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!selectedBusiness && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please select a business to use the AI assistant
              </p>
            </CardContent>
          </Card>
        )}

        {selectedBusiness && (
          <>
            {/* Vector Store Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Index Status
                    </CardTitle>
                    <CardDescription>
                      {loadingStatus ? "Checking status..." : 
                       vectorStoreStatus?.exists 
                         ? "Your business data is indexed and ready"
                         : "Data will be indexed on first query"}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={refreshVectorStore} 
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {vectorStoreStatus?.exists && vectorStoreStatus.recordCounts && (
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(vectorStoreStatus.recordCounts).map(([table, count]) => (
                      <div key={table} className="p-3 rounded-lg border border-border bg-card/50">
                        <p className="text-xs text-muted-foreground capitalize">
                          {table.replace(/_/g, ' ')}
                        </p>
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                  {vectorStoreStatus.timestamp && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {new Date(vectorStoreStatus.timestamp).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("What's my revenue trend?")}
                    >
                      "What's my revenue trend?"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Show top 10 customers")}
                    >
                      "Show top 10 customers"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("What are my best selling products?")}
                    >
                      "Best selling products"
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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Suggest cost savings")}
                    >
                      "Suggest cost savings"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Optimize inventory")}
                    >
                      "Optimize inventory"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Find profit opportunities")}
                    >
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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Compare to last month")}
                    >
                      "Compare to last month"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Why did sales change?")}
                    >
                      "Why did sales change?"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm" 
                      size="sm"
                      onClick={() => handleQuickQuery("Analyze customer segments")}
                    >
                      "Customer segments"
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div data-chat="true">
              <AIAssistant businessId={selectedBusiness} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AIAssistantPage;
