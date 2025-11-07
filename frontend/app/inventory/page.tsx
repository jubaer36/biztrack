"use client";

import { useEffect, useState } from "react";
import { InventoryAlerts } from "@/components/InventoryAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, AlertTriangle, TrendingDown, PackageCheck, RefreshCw, Loader2, Store, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "./inventory.css";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface InventoryStats {
  total_items: number;
  need_reorder: number;
  dead_stock: number;
  optimal_stock: number;
}

interface Product {
  product_id: string;
  product_name: string;
  description: string | null;
  price: number;
  selling_price: number;
  status: string | null;
  created_date: string;
  expense: number | null;
  stored_location: string | null;
  category_id: number | null;
  brand_id: number | null;
  supplier_id: number | null;
  product_category: {
    category_name: string;
  } | null;
  product_brand: {
    brand_name: string;
  } | null;
  supplier: {
    supplier_name: string;
  } | null;
}

interface FilterOptions {
  categories: Array<{
    category_id: number;
    category_name: string;
  }>;
  brands: Array<{
    brand_id: number;
    brand_name: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OptimizationResult {
  forecast?: Array<{
    product_id: string;
    product_name: string;
    demand_forecast_units: number;
    confidence_score: number;
  }>;
  reorder_plan?: Array<{
    product_id: string;
    product_name: string;
    current_status: string;
    reorder_point: number;
    reorder_quantity: number;
    estimated_cost: number;
    priority: string;
    rationale: string;
  }>;
  dead_stock?: Array<{
    product_id: string;
    product_name: string;
    last_sale_date: string;
    clearance_discount: number;
    estimated_loss: number;
    action: string;
  }>;
  bundles?: Array<{
    bundle_name: string;
    product_ids: string[];
    product_names: string[];
    bundle_price: number;
    estimated_margin: number;
    rationale: string;
    copurchase_frequency: number;
  }>;
  seasonal_recommendations?: Array<{
    action: string;
    category: string;
    percentage_change: number;
    rationale: string;
  }>;
  summary?: {
    total_capital_required: number;
    expected_roi: number;
    risk_level: string;
    key_insights: string[];
  };
}

const InventoryPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], brands: [] });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

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
      fetchProducts();
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchProducts();
    }
  }, [searchTerm, selectedCategory, selectedBrand]);

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/inventory/stats/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch inventory stats");

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load inventory statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const runOptimization = async () => {
    if (!selectedBusiness) return;

    try {
      setOptimizing(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/inventory/optimize/${selectedBusiness}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to run optimization");
      }

      const data = await response.json();
      setOptimization(data.optimization);
      
      // Refresh stats after optimization
      fetchStats();
    } catch (err: any) {
      console.error("Error running optimization:", err);
      setError(err.message || "Failed to run AI optimization");
    } finally {
      setOptimizing(false);
    }
  };

  const fetchProducts = async (page = 1) => {
    if (!selectedBusiness) return;

    try {
      setLoadingProducts(true);
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append('category_id', selectedCategory);
      if (selectedBrand && selectedBrand !== "all") params.append('brand_id', selectedBrand);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/inventory/products/${selectedBusiness}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setProducts(data.products || []);
      setFilterOptions(data.filters || { categories: [], brands: [] });
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoadingProducts(false);
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
                <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
                <p className="text-sm text-muted-foreground">Smart stock optimization</p>
              </div>
            </div>
            
            {/* Business Selector */}
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
                Please select a business to view inventory analytics
              </p>
            </CardContent>
          </Card>
        )}

        {selectedBusiness && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {loadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold text-foreground">{stats?.total_items || 0}</div>
                    )}
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
                    {loadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold text-foreground">{stats?.need_reorder || 0}</div>
                    )}
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
                    {loadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold text-foreground">{stats?.dead_stock || 0}</div>
                    )}
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
                    {loadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold text-foreground">{stats?.optimal_stock || 0}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Inventory</CardTitle>
                    <CardDescription>View and manage your product inventory</CardDescription>
                  </div>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search products by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {filterOptions.brands.map((brand) => (
                        <SelectItem key={brand.brand_id} value={brand.brand_id.toString()}>
                          {brand.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Cost Price</TableHead>
                            <TableHead className="text-right">Selling Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.product_id}>
                              <TableCell className="font-mono text-sm">{product.product_id}</TableCell>
                              <TableCell className="font-medium">{product.product_name}</TableCell>
                              <TableCell>{product.product_category?.category_name || '-'}</TableCell>
                              <TableCell>{product.product_brand?.brand_name || '-'}</TableCell>
                              <TableCell>{product.supplier?.supplier_name || '-'}</TableCell>
                              <TableCell className="text-right">${product.price?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell className="text-right">${product.selling_price?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  product.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : product.status === 'inactive'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.status || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>{product.stored_location || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchProducts(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchProducts(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Inventory Optimization</CardTitle>
                    <CardDescription>Run AI-powered analysis to get actionable insights</CardDescription>
                  </div>
                  <Button onClick={runOptimization} disabled={optimizing}>
                    {optimizing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Optimization
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {optimization && (
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary */}
                    {optimization.summary && (
                      <div className="p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Capital Required</p>
                            <p className="text-lg font-bold">${optimization.summary.total_capital_required?.toFixed(2) || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Expected ROI</p>
                            <p className="text-lg font-bold">{optimization.summary.expected_roi?.toFixed(1) || 0}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Level</p>
                            <p className="text-lg font-bold capitalize">{optimization.summary.risk_level || 'N/A'}</p>
                          </div>
                        </div>
                        {optimization.summary.key_insights && optimization.summary.key_insights.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Key Insights:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {optimization.summary.key_insights.map((insight, idx) => (
                                <li key={idx}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bundles */}
                    {optimization.bundles && optimization.bundles.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Recommended Bundles</h3>
                        <div className="space-y-3">
                          {optimization.bundles.slice(0, 3).map((bundle, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{bundle.bundle_name}</p>
                                <p className="text-sm text-muted-foreground mb-2">{bundle.rationale}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Price: ${bundle.bundle_price?.toFixed(2)}</span>
                                  <span>Margin: {bundle.estimated_margin?.toFixed(1)}%</span>
                                  <span>Co-purchase: {bundle.copurchase_frequency?.toFixed(0)}%</span>
                                </div>
                                <Button size="sm" className="mt-2">Create Bundle</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dead Stock */}
                    {optimization.dead_stock && optimization.dead_stock.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Dead Stock Clearance</h3>
                        <div className="space-y-3">
                          {optimization.dead_stock.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                              <div className="p-2 rounded-lg bg-destructive/10">
                                <TrendingDown className="h-5 w-5 text-destructive" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{item.product_name}</p>
                                <p className="text-sm text-muted-foreground mb-2">{item.action}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>Discount: {item.clearance_discount}%</span>
                                  <span>Est. Loss: ${item.estimated_loss?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seasonal Recommendations */}
                    {optimization.seasonal_recommendations && optimization.seasonal_recommendations.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Seasonal Adjustments</h3>
                        <div className="space-y-3">
                          {optimization.seasonal_recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                              <div className="p-2 rounded-lg bg-warning/10">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground capitalize">{rec.action} {rec.category}</p>
                                <p className="text-sm text-muted-foreground mb-2">{rec.rationale}</p>
                                <div className="text-sm">
                                  <span>Change: {rec.percentage_change > 0 ? '+' : ''}{rec.percentage_change}%</span>
                                </div>
                                <Button size="sm" variant="outline" className="mt-2">View Plan</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <InventoryAlerts businessId={selectedBusiness} />
          </>
        )}
      </main>
    </div>
  );
};

export default InventoryPage;
