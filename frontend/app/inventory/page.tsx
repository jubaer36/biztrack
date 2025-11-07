"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Package, AlertTriangle, TrendingDown, PackageCheck, Loader2, Store, Search, Filter, Sparkles, Edit, Check, ChevronsUpDown } from "lucide-react";
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
    product_count: number;
  }>;
  brands: Array<{
    brand_id: number;
    brand_name: string;
    product_count: number;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const InventoryPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], brands: [] });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  // Dropdown open states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [savingProduct, setSavingProduct] = useState(false);

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

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct || !selectedBusiness) return;

    try {
      setSavingProduct(true);
      const token = localStorage.getItem("access_token");
      
      // Only send the editable fields
      const updateData = {
        description: editingProduct.description,
        price: editingProduct.price,
        selling_price: editingProduct.selling_price,
        stored_location: editingProduct.stored_location,
        expense: editingProduct.expense,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/inventory/products/${selectedBusiness}/${selectedProduct.product_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) throw new Error("Failed to update product");

      // Refresh products list
      fetchProducts(pagination.page);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setEditingProduct({});
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product");
    } finally {
      setSavingProduct(false);
    }
  };

  // Helper functions for dropdown display
  const getSelectedCategoryName = () => {
    if (selectedCategory === "all") return "All Categories";
    const category = filterOptions.categories.find(c => c.category_id.toString() === selectedCategory);
    return category ? `${category.category_name} (${category.product_count})` : "All Categories";
  };

  const getSelectedBrandName = () => {
    if (selectedBrand === "all") return "All Brands";
    const brand = filterOptions.brands.find(b => b.brand_id.toString() === selectedBrand);
    return brand ? `${brand.brand_name} (${brand.product_count})` : "All Brands";
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
              {selectedBusiness && (
                <Button
                  onClick={() => router.push(`/inventory/optimize?business=${selectedBusiness}`)}
                  variant="outline"
                  className="ml-2"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Optimize
                </Button>
              )}
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
                  
                  {/* Category Searchable Dropdown */}
                  <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryDropdownOpen}
                        className="w-full sm:w-[200px] justify-between"
                      >
                        {getSelectedCategoryName()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full sm:w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setSelectedCategory("all");
                                setCategoryDropdownOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedCategory === "all" ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              All Categories
                            </CommandItem>
                            {filterOptions.categories.map((category) => (
                              <CommandItem
                                key={category.category_id}
                                value={`${category.category_name} ${category.product_count}`}
                                onSelect={() => {
                                  setSelectedCategory(category.category_id.toString());
                                  setCategoryDropdownOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedCategory === category.category_id.toString() ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {category.category_name} ({category.product_count})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Brand Searchable Dropdown */}
                  <Popover open={brandDropdownOpen} onOpenChange={setBrandDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandDropdownOpen}
                        className="w-full sm:w-[200px] justify-between"
                      >
                        {getSelectedBrandName()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full sm:w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search brands..." />
                        <CommandList>
                          <CommandEmpty>No brands found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setSelectedBrand("all");
                                setBrandDropdownOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedBrand === "all" ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              All Brands
                            </CommandItem>
                            {filterOptions.brands.map((brand) => (
                              <CommandItem
                                key={brand.brand_id}
                                value={`${brand.brand_name} ${brand.product_count}`}
                                onSelect={() => {
                                  setSelectedBrand(brand.brand_id.toString());
                                  setBrandDropdownOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedBrand === brand.brand_id.toString() ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {brand.brand_name} ({brand.product_count})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                            <TableRow 
                              key={product.product_id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleEditProduct(product)}
                            >
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
                              <TableCell className="flex items-center justify-between">
                                <span>{product.stored_location || '-'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProduct(product);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
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
          </>
        )}
      </main>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border shadow-xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and settings.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product ID</Label>
                  <Input
                    id="product_id"
                    value={editingProduct.product_id || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    value={editingProduct.product_name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Cost Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={editingProduct.selling_price || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingProduct.status || ''}
                    disabled
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stored_location">Storage Location</Label>
                  <Input
                    id="stored_location"
                    value={editingProduct.stored_location || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, stored_location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category ID</Label>
                  <Input
                    id="category_id"
                    type="number"
                    value={editingProduct.category_id || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_id">Brand ID</Label>
                  <Input
                    id="brand_id"
                    type="number"
                    value={editingProduct.brand_id || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier ID</Label>
                  <Input
                    id="supplier_id"
                    type="number"
                    value={editingProduct.supplier_id || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense">Expense</Label>
                <Input
                  id="expense"
                  type="number"
                  step="0.01"
                  value={editingProduct.expense || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, expense: parseFloat(e.target.value) || undefined }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={savingProduct}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={savingProduct}
            >
              {savingProduct ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
