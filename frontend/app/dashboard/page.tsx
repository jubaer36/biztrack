"use client";

import { MetricsCard } from "@/components/MetricsCard";
import { QuickActions } from "@/components/QuickActions";
import { FeatureCard } from "@/components/FeatureCard";
import { ForecastChart } from "@/components/ForecastChart";
import { CashFlowPrediction } from "@/components/CashFlowPrediction";
import { DollarSign, TrendingUp, Package, Users, Menu, Sparkles, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="border-b-2 border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50 animate-gradient">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  BizTrack
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  AI-Powered Business Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative hover:bg-blue-50">
                <Bell className="h-5 w-5 text-slate-600" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500 border-2 border-white">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                <Settings className="h-5 w-5 text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 animate-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <div className="inline-block">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold mb-4">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Dashboard Overview
              </Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              Welcome Back! 
            </h2>
            <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto">
              Your business is growing - here&apos;s today&apos;s snapshot
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Revenue"
            value="৳3.2L"
            change="+12.5% from last month"
            trend="up"
            icon={DollarSign}
            variant="success"
          />
          <MetricsCard
            title="Profit Margin"
            value="28.4%"
            change="+2.1% improvement"
            trend="up"
            icon={TrendingUp}
            variant="success"
          />
          <MetricsCard
            title="Inventory Value"
            value="৳1.8L"
            change="3 items need attention"
            trend="neutral"
            icon={Package}
            variant="warning"
          />
          <MetricsCard
            title="Active Customers"
            value="142"
            change="+8 new this month"
            trend="up"
            icon={Users}
          />
          </div>
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
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
              8 Features
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Data Upload"
              description="Import Excel/CSV files with AI-powered field mapping"
              icon="upload"
              href="/businesses"
              gradient="from-primary to-primary-hover"
            />
            <FeatureCard
              title="Sales Management"
              description="Record sales, manage customers, and track revenue"
              icon="cashflow"
              href="/sales"
              gradient="from-success to-success/80"
            />
            <FeatureCard
              title="Purchase Orders"
              description="Record purchases from suppliers and manage procurement"
              icon="inventory"
              href="/purchase-orders"
              gradient="from-warning to-warning/80"
            />
            <FeatureCard
              title="Demand Forecasting"
              description="AI predictions with weather, festivals, and market trends"
              icon="forecast"
              href="/forecast"
              gradient="from-accent to-accent-hover"
            />
            <FeatureCard
              title="Inventory Management"
              description="Smart stock optimization and reorder recommendations"
              icon="inventory"
              href="/inventory"
              gradient="from-warning to-warning/80"
            />
            <FeatureCard
              title="Cash Flow Intelligence"
              description="Real-time monitoring and credit risk analysis"
              icon="cashflow"
              href="/cashflow"
              gradient="from-success to-success/80"
            />
            <FeatureCard
              title="Customer Insights"
              description="RFM segmentation and automated engagement campaigns"
              icon="customers"
              href="/customer-insights"
              gradient="from-primary/80 to-accent/80"
            />
            <FeatureCard
              title="Bizmind"
              description="Natural language queries for business insights"
              icon="ai"
              href="/bizmind"
              gradient="from-accent/80 to-primary/80"
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
