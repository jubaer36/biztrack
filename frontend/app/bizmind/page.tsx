"use client";

import { useEffect, useState } from "react";
import { AIAssistant } from "@/components/AIAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Zap, TrendingUp, Store, Loader2, RefreshCw, Database, Sparkles, Brain } from "lucide-react";
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
  const [quickQuery, setQuickQuery] = useState<string>("");

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
    // Set the query in state and scroll to chat
    setQuickQuery(query);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="border-b-2 border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/dashboard")}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-700 flex items-center justify-center shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 bg-clip-text text-transparent">
                  Bizmind AI
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  Natural Language Business Intelligence
                </p>
              </div>
            </div>
            
            {/* Business Selector */}
            {businesses.length > 0 && (
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-slate-200/50 shadow-sm">
                <Store className="h-5 w-5 text-slate-600" />
                <select
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="bg-transparent text-slate-900 font-medium focus:outline-none min-w-[200px]"
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

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {/* AI/Brain background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/85 to-cyan-900/90" />
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-20 right-40 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <div className="inline-block">
              <div className="bg-cyan-400/20 text-white border-2 border-cyan-400/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Powered Insights
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
              Ask Anything About Your Business
            </h2>
            <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-lg">
              Get instant answers, insights, and recommendations powered by AI
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Real-time Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Natural Language</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 space-y-10">
        {error && (
          <Card className="border-2 border-red-200 bg-red-50/50 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <p className="text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {!selectedBusiness && (
          <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <Store className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-800 mb-2">
                  No Business Selected
                </p>
                <p className="text-slate-600">
                  Please select a business to use the AI assistant
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedBusiness && (
          <>
            {/* Vector Store Status Card */}
            <Card className="border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Data Index Status
                      </span>
                    </CardTitle>
                    <CardDescription className="ml-12 mt-1 text-slate-600">
                      {loadingStatus ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking status...
                        </span>
                      ) : vectorStoreStatus?.exists ? (
                        <span className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Your business data is indexed and ready
                        </span>
                      ) : (
                        "Data will be indexed on first query"
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={refreshVectorStore} 
                    disabled={refreshing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
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
                      <div key={table} className="p-4 rounded-xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {table.replace(/_/g, ' ')}
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                          {count}
                        </p>
                      </div>
                    ))}
                  </div>
                  {vectorStoreStatus.timestamp && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 block" />
                        Last updated: {new Date(vectorStoreStatus.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Quick Action Cards */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-1 rounded-full bg-blue-600" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Quick Actions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                        Quick Queries
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("What's my revenue trend?")}
                      >
                        "What's my revenue trend?"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Show top 10 customers")}
                      >
                        "Show top 10 customers"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("What are my best selling products?")}
                      >
                        "Best selling products"
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              
                <Card className="border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-md">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                        Smart Insights
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-amber-50 hover:border-amber-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Suggest cost savings")}
                      >
                        "Suggest cost savings"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-amber-50 hover:border-amber-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Optimize inventory")}
                      >
                        "Optimize inventory"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-amber-50 hover:border-amber-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Find profit opportunities")}
                      >
                        "Find profit opportunities"
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                        Analysis
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Compare to last month")}
                      >
                        "Compare to last month"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Why did sales change?")}
                      >
                        "Why did sales change?"
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-colors border-2" 
                        size="sm"
                        onClick={() => handleQuickQuery("Analyze customer segments")}
                      >
                        "Customer segments"
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* AI Chat Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-1 rounded-full bg-indigo-600" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Chat with Bizmind AI
                </h2>
              </div>
              <div data-chat="true">
                <AIAssistant businessId={selectedBusiness} quickQuery={quickQuery} onQueryProcessed={() => setQuickQuery("")} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t-2 border-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-sm mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-cyan-600/5" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Bizmind AI
                </p>
                <p className="text-sm text-slate-600">
                  Powered by Advanced Language Models
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              <span>Natural Language Processing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AIAssistantPage;
