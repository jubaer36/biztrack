"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MetricsCard } from "@/components/MetricsCard";
import { QuickActions } from "@/components/QuickActions";
import { FeatureCard } from "@/components/FeatureCard";
import { ForecastChart } from "@/components/ForecastChart";
import { CashFlowPrediction } from "@/components/CashFlowPrediction";
import { DollarSign, TrendingUp, Package, Users, Menu, Sparkles, Bell, Settings, Store, Loader2, User, LogOut, HelpCircle, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Business {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface DashboardMetrics {
  totalRevenue: {
    value: number;
    change: string;
    trend: string;
    formatted: string;
  };
  profitMargin: {
    value: number;
    change: string;
    trend: string;
    formatted: string;
  };
  inventoryValue: {
    value: number;
    itemsNeedingAttention: number;
    trend: string;
    formatted: string;
  };
  activeCustomers: {
    value: number;
    newCustomers: number;
    trend: string;
    formatted: string;
  };
}

const Dashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

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
      fetchMetrics();
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
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const fetchMetrics = async () => {
    if (!selectedBusiness) return;

    try {
      setLoadingMetrics(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/dashboard/metrics/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch metrics");

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth/login");
  };

  if (authLoading || loadingBusinesses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="border-b-2 border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  BizTrack
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  AI-Powered Business Intelligence
                </p>
              </div>
            </div>
            
            {/* Business Selector - Right Side */}
            <div className="flex items-center gap-3">
              {businesses.length > 0 ? (
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
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading businesses...</span>
                </div>
              )}
              
              <Button variant="ghost" size="icon" className="relative hover:bg-blue-50">
                <Bell className="h-5 w-5 text-slate-600" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-br from-red-600 to-rose-600 border-2 border-white">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                <Settings className="h-5 w-5 text-slate-600" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                    <Menu className="h-5 w-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => router.push("/businesses")}>
                    <Store className="mr-2 h-4 w-4" />
                    <span>My Businesses</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/docs")}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/help")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {/* Dashboard analytics background image */}
        <div className="absolute inset-0">
          <img 
            src="/dashboard-hero.jpg" 
            alt="Dashboard Analytics" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-indigo-900/80" />
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <div className="inline-block">
              <Badge className="bg-cyan-400/20 text-white border-cyan-400/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold mb-4">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Dashboard Overview
              </Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
              Welcome Back!
            </h2>
            <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-lg">
              Your business is growing - here&apos;s today&apos;s snapshot
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI Insights Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 space-y-10">
        {/* Key Metrics */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-1 rounded-full bg-blue-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Key Performance Metrics
            </h2>
          </div>
          {loadingMetrics ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Store className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <p className="text-xl font-bold text-slate-800 mb-2">No Businesses Found</p>
                <p className="text-slate-600 mb-6">Create your first business to start tracking metrics</p>
                <Button 
                  onClick={() => router.push("/businesses")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Create Business
                </Button>
              </div>
            </div>
          ) : !selectedBusiness ? (
            <div className="text-center py-20 text-slate-600">
              <Store className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium">Please select a business to view metrics</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard
                title="Total Revenue"
                value={metrics.totalRevenue.formatted}
                change={`${parseFloat(metrics.totalRevenue.change) >= 0 ? '+' : ''}${metrics.totalRevenue.change}% from last month`}
                trend={metrics.totalRevenue.trend as "up" | "down" | "neutral"}
                icon={DollarSign}
                variant="success"
              />
              <MetricsCard
                title="Profit Margin"
                value={metrics.profitMargin.formatted}
                change={`${parseFloat(metrics.profitMargin.change) >= 0 ? '+' : ''}${metrics.profitMargin.change}% improvement`}
                trend={metrics.profitMargin.trend as "up" | "down" | "neutral"}
                icon={TrendingUp}
                variant="success"
              />
              <MetricsCard
                title="Inventory Value"
                value={metrics.inventoryValue.formatted}
                change={`${metrics.inventoryValue.itemsNeedingAttention} items need attention`}
                trend={metrics.inventoryValue.trend as "up" | "down" | "neutral"}
                icon={Package}
                variant="warning"
              />
              <MetricsCard
                title="Active Customers"
                value={metrics.activeCustomers.formatted}
                change={`+${metrics.activeCustomers.newCustomers} new this month`}
                trend={metrics.activeCustomers.trend as "up" | "down" | "neutral"}
                icon={Users}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600">
              <p>No metrics available</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Feature Navigation Cards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-indigo-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Business Intelligence Features
            </h2>
            <Badge className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-0">
              8 Features
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Data Upload"
              description="Import Excel/CSV files with AI-powered field mapping"
              icon="upload"
              href="/businesses"
              gradient="from-blue-600 to-indigo-600"
            />
            <FeatureCard
              title="Sales Management"
              description="Record sales, manage customers, and track revenue"
              icon="cashflow"
              href="/sales"
              gradient="from-emerald-600 to-teal-600"
            />
            <FeatureCard
              title="Purchase Orders"
              description="Record purchases from suppliers and manage procurement"
              icon="inventory"
              href="/purchase-orders"
              gradient="from-amber-600 to-orange-600"
            />
            <FeatureCard
              title="Demand Forecasting"
              description="AI predictions with weather, festivals, and market trends"
              icon="forecast"
              href="/forecast"
              gradient="from-purple-600 to-pink-600"
            />
            <FeatureCard
              title="Inventory Management"
              description="Smart stock optimization and reorder recommendations"
              icon="inventory"
              href="/inventory"
              gradient="from-orange-600 to-red-600"
            />
            <FeatureCard
              title="Cash Flow Intelligence"
              description="Real-time monitoring and credit risk analysis"
              icon="cashflow"
              href="/cashflow"
              gradient="from-green-600 to-emerald-600"
            />
            <FeatureCard
              title="Customer Insights"
              description="RFM segmentation and automated engagement campaigns"
              icon="customers"
              href="/customer-insights"
              gradient="from-cyan-600 to-blue-600"
            />
            <FeatureCard
              title="Bizmind"
              description="Natural language queries for business insights"
              icon="ai"
              href="/bizmind"
              gradient="from-violet-600 to-purple-600"
            />
          </div>
        </div>

        {/* Analytics Preview */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-purple-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Analytics & Predictions
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ForecastChart />
            <CashFlowPrediction />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t-2 border-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-sm mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  BizTrack
                </p>
                <p className="text-sm text-slate-600">
                  Empowering Bangladesh SMEs with AI-driven insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Powered by Advanced AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
