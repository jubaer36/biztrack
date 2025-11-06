"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, User, Eye, Mail, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AtRiskCustomersModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer: (customerId: number) => void;
}

interface AtRiskCustomer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  rfm_segment: string;
  recency_days: number;
  last_purchase_date: string;
  monetary_value: number;
  frequency_count: number;
  churn_risk_score: number;
}

const getRiskLevel = (score: number): { label: string; variant: string; color: string } => {
  if (score >= 90) return { label: "Critical", variant: "destructive", color: "text-destructive" };
  if (score >= 70) return { label: "High", variant: "destructive", color: "text-destructive" };
  if (score >= 50) return { label: "Medium", variant: "warning", color: "text-warning" };
  return { label: "Low", variant: "default", color: "text-muted-foreground" };
};

export const AtRiskCustomersModal = ({ 
  businessId, 
  isOpen, 
  onClose,
  onViewCustomer
}: AtRiskCustomersModalProps) => {
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) {
      fetchAtRiskCustomers();
    }
  }, [isOpen, businessId]);

  const fetchAtRiskCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/at-risk/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch at-risk customers");

      const data = await response.json();
      setCustomers(data.at_risk_customers || []);
      setStatistics(data.statistics);
    } catch (err) {
      console.error("Error fetching at-risk customers:", err);
      setError("Failed to load at-risk customers");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <h2 className="text-2xl font-bold text-foreground">At-Risk Customers</h2>
              <Badge variant="warning">{customers.length} Customers</Badge>
            </div>
            {statistics && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Revenue at Risk: ${statistics.total_revenue_at_risk?.toFixed(2) || 0}</span>
                <span>High Risk: {statistics.high_risk_count || 0}</span>
                <span>Avg Churn Risk: {statistics.avg_churn_risk?.toFixed(1) || 0}%</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchAtRiskCustomers}>Retry</Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
              <p className="text-success font-semibold mb-2">Great News!</p>
              <p className="text-muted-foreground">No customers are currently at risk of churning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => {
                const riskLevel = getRiskLevel(customer.churn_risk_score);
                return (
                  <Card key={customer.customer_id} className={`hover:shadow-md transition-shadow ${
                    customer.churn_risk_score >= 70 ? 'border-destructive/50' : ''
                  }`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-full ${
                            customer.churn_risk_score >= 70 ? 'bg-destructive/10' : 'bg-warning/10'
                          }`}>
                            <User className={`h-5 w-5 ${
                              customer.churn_risk_score >= 70 ? 'text-destructive' : 'text-warning'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {customer.customer_name}
                              </h3>
                              <Badge variant={riskLevel.variant as any} className="text-xs">
                                {riskLevel.label} Risk - {customer.churn_risk_score}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {customer.rfm_segment}
                              </Badge>
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Last Purchase</p>
                                <p className="text-sm font-semibold">
                                  {customer.recency_days} days ago
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(customer.last_purchase_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Orders</p>
                                <p className="text-sm font-semibold">{customer.frequency_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Value</p>
                                <p className="text-sm font-semibold">${customer.monetary_value.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Order</p>
                                <p className="text-sm font-semibold">
                                  ${customer.frequency_count > 0 
                                    ? (customer.monetary_value / customer.frequency_count).toFixed(2) 
                                    : '0.00'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              onViewCustomer(customer.customer_id);
                              onClose();
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="default">
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white">
          <div className="text-sm text-muted-foreground">
            {customers.length} at-risk customers • ${statistics?.total_revenue_at_risk?.toFixed(2) || 0} at risk
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button>Create Win-Back Campaign</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
