"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerInsights } from "@/components/CustomerInsights";
import { CustomerDetailModal } from "@/components/CustomerDetailModal";
import { SegmentCustomersModal } from "@/components/SegmentCustomersModal";
import { AtRiskCustomersModal } from "@/components/AtRiskCustomersModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Star, TrendingDown, Heart, Loader2, Store, RefreshCw, Mail, Eye, Edit, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface SegmentStats {
  rfm_segment: string;
  customer_count: number;
  total_segment_revenue: number;
  avg_customer_value: number;
}

interface AtRiskStats {
  total_at_risk: number;
  high_risk_count: number;
  total_revenue_at_risk: number;
  avg_churn_risk: number;
}

interface Campaign {
  campaign_id: number;
  campaign_name: string;
  campaign_type: string;
  target_segment: string;
  status: string;
  discount_percentage: number;
  target_customers: number[];
  created_at: string;
}

interface AIInsights {
  engagement_campaigns?: Array<{
    campaign_name: string;
    campaign_type: string;
    target_segment: string;
    target_customer_count: number;
    email_subject: string;
    email_body: string;
    discount_percentage: number;
    priority: string;
    rationale: string;
  }>;
  summary?: {
    total_customers_analyzed: number;
    high_priority_actions: number;
    estimated_revenue_at_risk: number;
    estimated_revenue_opportunity: number;
    key_insights: string[];
  };
}

const CustomerInsightsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [segmentStats, setSegmentStats] = useState<SegmentStats[]>([]);
  const [atRiskStats, setAtRiskStats] = useState<AtRiskStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isAtRiskModalOpen, setIsAtRiskModalOpen] = useState(false);

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
      fetchStats();
      fetchCampaigns();
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

  const fetchStats = async () => {
    if (!selectedBusiness) return;

    try {
      setLoadingStats(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      
      // Fetch segment statistics
      const segmentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/segments/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (segmentResponse.ok) {
        const segmentData = await segmentResponse.json();
        setSegmentStats(segmentData.segments || []);
      }

      // Fetch at-risk customer statistics
      const atRiskResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/at-risk/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (atRiskResponse.ok) {
        const atRiskData = await atRiskResponse.json();
        setAtRiskStats(atRiskData.statistics);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load customer statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedBusiness) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/campaigns/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedBusiness) return;

    try {
      setAnalyzing(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/analyze/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to run AI analysis");
      }

      const data = await response.json();
      setAiInsights(data.insights);
      
      // Refresh stats after analysis
      fetchStats();
      fetchCampaigns();
    } catch (err: any) {
      console.error("Error running AI analysis:", err);
      setError(err.message || "Failed to run AI analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewSegment = (segment: string) => {
    setSelectedSegment(segment);
    setIsSegmentModalOpen(true);
  };

  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsCustomerModalOpen(true);
  };

  if (authLoading || loadingBusinesses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const championsCount = segmentStats.find(s => s.rfm_segment === "Champions")?.customer_count || 0;
  const loyalCount = segmentStats.find(s => s.rfm_segment === "Loyal Customers")?.customer_count || 0;
  const totalCustomers = segmentStats.reduce((sum, s) => sum + s.customer_count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <header className="border-b-2 border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="hover:bg-blue-50">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">Customer Intelligence</h1>
                <p className="text-sm font-medium text-slate-600">RFM segmentation & insights</p>
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

      <main className="container mx-auto px-4 py-10 space-y-10">
        {error && (
          <Card className="border-2 border-red-200/50 bg-gradient-to-br from-red-50 to-white shadow-lg">
            <CardContent className="pt-6">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {!selectedBusiness && (
          <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl">
            <CardContent className="pt-6">
              <p className="text-center text-slate-600">
                Please select a business to view customer insights
              </p>
            </CardContent>
          </Card>
        )}

        {selectedBusiness && (
          <>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-1 rounded-full bg-cyan-600" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Customer Segments Overview
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group" 
                    onClick={() => handleViewSegment("Champions")}>
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600" />
                <CardHeader className="pb-3 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Champions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      {loadingStats ? (
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-br from-emerald-700 to-teal-700 bg-clip-text text-transparent">{championsCount}</div>
                      )}
                    </div>
                    <Eye className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 mt-2">Top customers</p>
                </CardContent>
              </Card>
              
              <Card className="relative border-2 border-blue-200/50 bg-gradient-to-br from-blue-50 to-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group" 
                    onClick={() => handleViewSegment("Loyal Customers")}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-600" />
                <CardHeader className="pb-3 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Loyal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      {loadingStats ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-br from-blue-700 to-cyan-700 bg-clip-text text-transparent">{loyalCount}</div>
                      )}
                    </div>
                    <Eye className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-xs font-semibold text-blue-700 mt-2">Regular buyers</p>
                </CardContent>
              </Card>

              <Card className="relative border-2 border-amber-200/50 bg-gradient-to-br from-amber-50 to-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group" 
                    onClick={() => setIsAtRiskModalOpen(true)}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 to-orange-600" />
                <CardHeader className="pb-3 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">At Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <TrendingDown className="h-6 w-6 text-white" />
                      </div>
                      {loadingStats ? (
                        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-br from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          {atRiskStats?.total_at_risk || 0}
                        </div>
                      )}
                    </div>
                    <Eye className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-xs font-semibold text-amber-700 mt-2">Need attention</p>
                </CardContent>
              </Card>

              <Card className="relative border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-600 to-slate-700" />
                <CardHeader className="pb-3 space-y-0">
                  <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    {loadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                    ) : (
                      <div className="text-3xl font-bold bg-gradient-to-br from-slate-700 to-slate-800 bg-clip-text text-transparent">{totalCustomers}</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-2">Total customers</p>
                </CardContent>
              </Card>
            </div>
            </div>

            {/* AI Analysis Card */}
            <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-purple-50/30 shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">AI Customer Analysis</CardTitle>
                      <CardDescription className="text-slate-600">Run AI-powered analysis for personalized retention strategies</CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={runAIAnalysis} 
                    disabled={analyzing}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {aiInsights?.summary && (
                <CardContent>
                  <div className="p-6 rounded-2xl border-2 border-purple-200/50 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Customers Analyzed</p>
                        <p className="text-3xl font-bold bg-gradient-to-br from-purple-700 to-indigo-700 bg-clip-text text-transparent">{aiInsights.summary.total_customers_analyzed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">High Priority Actions</p>
                        <p className="text-3xl font-bold bg-gradient-to-br from-amber-700 to-orange-700 bg-clip-text text-transparent">{aiInsights.summary.high_priority_actions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Revenue at Risk</p>
                        <p className="text-3xl font-bold bg-gradient-to-br from-red-700 to-rose-700 bg-clip-text text-transparent">
                          ${aiInsights.summary.estimated_revenue_at_risk?.toFixed(2) || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Revenue Opportunity</p>
                        <p className="text-3xl font-bold bg-gradient-to-br from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                          ${aiInsights.summary.estimated_revenue_opportunity?.toFixed(2) || 0}
                        </p>
                      </div>
                    </div>
                    {aiInsights.summary.key_insights && aiInsights.summary.key_insights.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          Key Insights:
                        </p>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {aiInsights.summary.key_insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              <span className="leading-relaxed">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <CustomerInsights businessId={selectedBusiness} onViewSegment={handleViewSegment} />
            
            <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-white via-white to-slate-50 shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-600" />
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">Automated Engagement Campaigns</CardTitle>
                    <CardDescription className="text-slate-600">
                      {campaigns.length > 0 
                        ? "Manage your customer retention campaigns"
                        : "AI-powered customer retention strategies - Run AI analysis to generate campaigns"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 && !aiInsights?.engagement_campaigns ? (
                  <div className="text-center py-12 text-slate-600">
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Mail className="h-10 w-10 text-blue-600" />
                    </div>
                    <p className="font-medium">No campaigns yet. Run AI analysis to get personalized campaign recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show AI-generated campaign recommendations */}
                    {aiInsights?.engagement_campaigns?.slice(0, 3).map((campaign, idx) => (
                      <div key={`ai-${idx}`} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300 group">
                        <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${
                          campaign.campaign_type === 'winback' ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
                          campaign.campaign_type === 'loyalty' ? 'bg-gradient-to-br from-emerald-600 to-teal-600' :
                          campaign.campaign_type === 'upsell' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                        }`}>
                          {campaign.campaign_type === 'winback' ? <TrendingDown className="h-6 w-6 text-white" /> :
                           campaign.campaign_type === 'loyalty' ? <Star className="h-6 w-6 text-white" /> :
                           <Heart className="h-6 w-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-slate-900 text-lg">{campaign.campaign_name}</p>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                              campaign.priority === 'high' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' :
                              campaign.priority === 'medium' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' :
                              'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                            }`}>
                              {campaign.priority.toUpperCase()} Priority
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2 font-medium">
                            Targeting {campaign.target_customer_count} {campaign.target_segment} customers
                            {campaign.discount_percentage > 0 && ` with ${campaign.discount_percentage}% discount`}
                          </p>
                          <p className="text-sm text-slate-600 mb-4 italic bg-slate-50 p-3 rounded-lg border border-slate-200">"{campaign.email_subject}"</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">Create Campaign</Button>
                            <Button size="sm" variant="outline" className="border-2 hover:bg-slate-50">View Details</Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show existing campaigns */}
                    {campaigns.map((campaign) => (
                      <div key={campaign.campaign_id} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300 group">
                        <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ${
                          campaign.campaign_type === 'winback' ? 'bg-gradient-to-br from-amber-600 to-orange-600' :
                          campaign.campaign_type === 'loyalty' ? 'bg-gradient-to-br from-emerald-600 to-teal-600' :
                          campaign.campaign_type === 'upsell' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                        }`}>
                          {campaign.campaign_type === 'winback' ? <TrendingDown className="h-6 w-6 text-white" /> :
                           campaign.campaign_type === 'loyalty' ? <Star className="h-6 w-6 text-white" /> :
                           <Heart className="h-6 w-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-slate-900 text-lg">{campaign.campaign_name}</p>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                              campaign.status === 'active' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' :
                              campaign.status === 'scheduled' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' :
                              campaign.status === 'completed' ? 'bg-slate-200 text-slate-700' :
                              'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                            }`}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-4 font-medium">
                            Targeting {campaign.target_customers?.length || 0} {campaign.target_segment} customers
                            {campaign.discount_percentage > 0 && ` with ${campaign.discount_percentage}% discount`}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"><Eye className="h-4 w-4 mr-1" />View Details</Button>
                            <Button size="sm" variant="outline" className="border-2 hover:bg-slate-50"><Edit className="h-4 w-4 mr-1" />Edit Campaign</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modals */}
      {selectedCustomerId && (
        <CustomerDetailModal
          businessId={selectedBusiness}
          customerId={selectedCustomerId}
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomerId(null);
          }}
        />
      )}

      {selectedSegment && (
        <SegmentCustomersModal
          businessId={selectedBusiness}
          segment={selectedSegment}
          isOpen={isSegmentModalOpen}
          onClose={() => {
            setIsSegmentModalOpen(false);
            setSelectedSegment(null);
          }}
          onViewCustomer={handleViewCustomer}
        />
      )}

      <AtRiskCustomersModal
        businessId={selectedBusiness}
        isOpen={isAtRiskModalOpen}
        onClose={() => setIsAtRiskModalOpen(false)}
        onViewCustomer={handleViewCustomer}
      />
    </div>
  );
};

export default CustomerInsightsPage;
