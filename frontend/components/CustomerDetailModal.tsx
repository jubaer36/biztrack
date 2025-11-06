"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  AlertCircle,
  Package,
  Star
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomerDetailModalProps {
  businessId: string;
  customerId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface CustomerDetail {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  rfm_segment: string;
  recency_days: number;
  frequency_count: number;
  monetary_value: number;
  churn_risk_score: number;
  avg_order_value: number;
  first_purchase_date: string;
  last_purchase_date: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  behavior?: {
    unique_products_purchased: number;
    unique_categories_purchased: number;
    unique_brands_purchased: number;
    avg_days_between_purchases: number;
  };
  clv?: {
    total_clv: number;
    predicted_clv: number;
    value_tier: string;
  };
  recent_orders?: Array<{
    sales_order_id: number;
    order_date: string;
    total_amount: number;
    status: string;
  }>;
  recommendations?: Array<{
    recommended_product_name: string;
    selling_price: number;
    popularity_score: number;
  }>;
  insights?: Array<{
    insight_type: string;
    recommendation: string;
    suggested_discount: number;
    campaign_priority: string;
  }>;
  trends?: Array<{
    purchase_month: string;
    monthly_spend: number;
    spending_trend: string;
  }>;
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

const getRiskColor = (score: number): string => {
  if (score >= 70) return "text-destructive";
  if (score >= 50) return "text-warning";
  if (score >= 30) return "text-yellow-600";
  return "text-success";
};

export const CustomerDetailModal = ({ 
  businessId, 
  customerId, 
  isOpen, 
  onClose 
}: CustomerDetailModalProps) => {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId && businessId) {
      fetchCustomerDetail();
    }
  }, [isOpen, customerId, businessId]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/customer-insights/customer/${businessId}/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer details");

      const data = await response.json();
      setCustomer(data.customer);
    } catch (err) {
      console.error("Error fetching customer details:", err);
      setError("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Customer Details</h2>
            <p className="text-sm text-muted-foreground">Complete customer profile and insights</p>
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
              <Button onClick={fetchCustomerDetail}>Retry</Button>
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{customer.customer_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getSegmentColor(customer.rfm_segment) as any}>
                            {customer.rfm_segment}
                          </Badge>
                          {customer.clv?.value_tier && (
                            <Badge variant="outline">{customer.clv.value_tier}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Churn Risk</p>
                      <p className={`text-2xl font-bold ${getRiskColor(customer.churn_risk_score)}`}>
                        {customer.churn_risk_score}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Customer since {new Date(customer.first_purchase_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last purchase {new Date(customer.last_purchase_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RFM Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{customer.recency_days}</span>
                        <span className="text-sm text-muted-foreground">days ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Score:</span>
                        <Badge variant="outline">{customer.recency_score}/5</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{customer.frequency_count}</span>
                        <span className="text-sm text-muted-foreground">orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Score:</span>
                        <Badge variant="outline">{customer.frequency_score}/5</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monetary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${customer.monetary_value.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Score:</span>
                        <Badge variant="outline">{customer.monetary_score}/5</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase Behavior & CLV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Purchase Behavior</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Order Value</span>
                      <span className="font-semibold">${customer.avg_order_value.toFixed(2)}</span>
                    </div>
                    {customer.behavior && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Unique Products</span>
                          <span className="font-semibold">{customer.behavior.unique_products_purchased}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Categories</span>
                          <span className="font-semibold">{customer.behavior.unique_categories_purchased}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Brands</span>
                          <span className="font-semibold">{customer.behavior.unique_brands_purchased}</span>
                        </div>
                        {customer.behavior.avg_days_between_purchases && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg Days Between Orders</span>
                            <span className="font-semibold">
                              {customer.behavior.avg_days_between_purchases.toFixed(1)} days
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {customer.clv && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Customer Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current CLV</span>
                        <span className="font-bold text-lg">${customer.clv.total_clv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Predicted CLV</span>
                        <span className="font-semibold text-primary">
                          ${customer.clv.predicted_clv.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Value Tier</span>
                        <Badge variant={
                          customer.clv.value_tier === 'VIP' ? 'default' :
                          customer.clv.value_tier === 'High Value' ? 'default' : 'outline'
                        }>
                          {customer.clv.value_tier}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* AI Insights */}
              {customer.insights && customer.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={insight.insight_type === 'churn_prevention' ? 'destructive' : 'default'}>
                              {insight.insight_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {insight.suggested_discount > 0 && (
                              <span className="text-sm font-semibold text-success">
                                {insight.suggested_discount}% discount
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{insight.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product Recommendations */}
              {customer.recommendations && customer.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Recommended Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customer.recommendations.slice(0, 5).map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{product.recommended_product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Popularity: {product.popularity_score}
                            </p>
                          </div>
                          <span className="font-semibold">${product.selling_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Orders */}
              {customer.recent_orders && customer.recent_orders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customer.recent_orders.slice(0, 5).map((order, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Order #{order.sales_order_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.order_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                            <Badge variant="outline" className="text-xs">{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Spending Trends */}
              {customer.trends && customer.trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Spending Trends (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customer.trends.map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {new Date(trend.purchase_month).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                            <Badge 
                              variant={
                                trend.spending_trend === 'Increasing' ? 'default' :
                                trend.spending_trend === 'Decreasing' ? 'destructive' : 'outline'
                              }
                              className="text-xs"
                            >
                              {trend.spending_trend}
                            </Badge>
                          </div>
                          <span className="font-semibold">${trend.monthly_spend.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 bg-white">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button>Send Email</Button>
        </div>
      </div>
    </div>
  );
};
