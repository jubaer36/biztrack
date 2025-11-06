"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, User, Eye, Mail, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SegmentCustomersModalProps {
  businessId: string;
  segment: string;
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer: (customerId: number) => void;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  recency_days: number;
  frequency_count: number;
  monetary_value: number;
  churn_risk_score: number;
  avg_order_value: number;
}

const getSegmentColor = (segment: string): string => {
  const segmentMap: { [key: string]: string } = {
    "Champions": "success",
    "Loyal Customers": "primary",
    "Potential Loyalists": "primary",
    "At Risk": "warning",
    "Cant Lose Them": "warning",
    "Hibernating": "warning",
    "Lost": "destructive",
    "New Customers": "default",
    "Promising": "default",
    "Need Attention": "warning"
  };
  return segmentMap[segment] || "default";
};

export const SegmentCustomersModal = ({ 
  businessId, 
  segment, 
  isOpen, 
  onClose,
  onViewCustomer
}: SegmentCustomersModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && segment && businessId) {
      fetchSegmentCustomers();
    }
  }, [isOpen, segment, businessId]);

  const fetchSegmentCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/segment-customers/${businessId}/${encodeURIComponent(segment)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch segment customers");

      const data = await response.json();
      setCustomers(data.customers || []);
      setStatistics(data.statistics);
    } catch (err) {
      console.error("Error fetching segment customers:", err);
      setError("Failed to load segment customers");
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
              <h2 className="text-2xl font-bold text-foreground">{segment} Customers</h2>
              <Badge variant={getSegmentColor(segment) as any}>{customers.length} Customers</Badge>
            </div>
            {statistics && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total Revenue: ${statistics.total_revenue?.toFixed(2) || 0}</span>
                <span>Avg: ${statistics.avg_revenue?.toFixed(2) || 0}</span>
                <span>Frequency: {statistics.avg_frequency?.toFixed(1) || 0}</span>
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
              <Button onClick={fetchSegmentCustomers}>Retry</Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No customers in this segment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Card key={customer.customer_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {customer.customer_name}
                            </h3>
                            {customer.churn_risk_score >= 50 && (
                              <Badge variant="destructive" className="text-xs">
                                High Risk
                              </Badge>
                            )}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Recency</p>
                              <p className="text-sm font-semibold">{customer.recency_days} days</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Orders</p>
                              <p className="text-sm font-semibold">{customer.frequency_count}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Spent</p>
                              <p className="text-sm font-semibold">${customer.monetary_value.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Avg Order</p>
                              <p className="text-sm font-semibold">${customer.avg_order_value.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white">
          <div className="text-sm text-muted-foreground">
            {customers.length} customers • ${statistics?.total_revenue?.toFixed(2) || 0} total revenue
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button>Create Campaign</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
