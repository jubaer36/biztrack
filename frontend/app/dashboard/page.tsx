"use client";

import { MetricsCard } from "@/components/MetricsCard";
import { QuickActions } from "@/components/QuickActions";
import { FeatureCard } from "@/components/FeatureCard";
import { ForecastChart } from "@/components/ForecastChart";
import { CashFlowPrediction } from "@/components/CashFlowPrediction";
import { DollarSign, TrendingUp, Package, Users, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-black">BizTrack</span>
            </div>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src="/dashboard-hero.jpg"
          alt="Business Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome Back! 👋
            </h2>
            <p className="text-white/80">
              Your business is growing - here&apos;s today&apos;s snapshot
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
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

        {/* Quick Actions */}
        <QuickActions />

        {/* Feature Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Business Intelligence Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Data Upload"
              description="Import Excel/CSV files with AI-powered field mapping"
              icon="upload"
              href="/businesses"
              gradient="from-primary to-primary-hover"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ForecastChart />
          <CashFlowPrediction />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            BizTrack - Empowering Bangladesh SMEs with AI-driven insights
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
