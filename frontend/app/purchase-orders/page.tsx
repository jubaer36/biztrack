"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Minus, ShoppingCart, User, Package, Store, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
}

interface Product {
  product_name: string;
  brand_name: string;
  category_name: string;
  price: number;
  selling_price: number;
  brand_id: number;
  category_id: number;
  stock_count: number;
  product_ids: string[];
}

interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

interface Brand {
  brand_id: number;
  brand_name: string;
  description: string | null;
  unit_price: number;
}

interface CartItem {
  product_name: string;
  brand_name: string;
  category_name: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  brand_id: number;
  category_id: number;
}

interface PurchaseOrder {
  purchase_order_id: number;
  order_date: string;
  delivery_date: string;
  total_amount: number;
  status: string;
  notes: string | null;
  supplier: {
    supplier_name: string;
    contact_person: string;
    email: string;
    phone: string;
  };
  purchase_order_items: Array<{
    product_brand_id: number;
    quantity_ordered: number;
    unit_cost: number;
    line_total: number;
    product_brand: {
      brand_name: string;
    };
  }>;
}

export default function RecordPurchasePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseOrder[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [lastRecordedPurchase, setLastRecordedPurchase] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [highlightedPurchaseId, setHighlightedPurchaseId] = useState<number | null>(null);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    category_name: '',
    description: ''
  });
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [newBrandData, setNewBrandData] = useState({
    brand_name: '',
    description: '',
    unit_price: 0
  });
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchSuppliers();
      fetchProducts();
      fetchCategories();
      fetchBrands();
      fetchPurchaseHistory();
    }
  }, [selectedBusiness]);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    setTotal(newTotal);
  }, [cart]);

  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/businesses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch businesses');

      const data = await response.json();
      setBusinesses(data.businesses || []);

      // Check if there's a stored business selection from localStorage
      const storedBusinessId = localStorage.getItem('selectedBusinessId');

      if (storedBusinessId && data.businesses?.some((b: Business) => b.id === storedBusinessId)) {
        // Use the stored business if it exists and is valid
        setSelectedBusiness(storedBusinessId);
      } else if (data.businesses && data.businesses.length > 0) {
        // Auto-select first business if no stored selection or invalid stored selection
        setSelectedBusiness(data.businesses[0].id);
        // Store the default selection
        localStorage.setItem('selectedBusinessId', data.businesses[0].id);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      toast.error('Failed to load businesses');
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/suppliers/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/products/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/categories/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/brands/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseHistory(data.purchase_orders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      toast.error('Failed to load purchase history');
    }
  };

  const handleAddToCart = () => {
    if (!productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    if (!selectedCategoryId && !isNewCategory) {
      toast.error('Please select a category');
      return;
    }

    if (isNewCategory && !newCategoryData.category_name.trim()) {
      toast.error('Please enter category name');
      return;
    }

    if (!selectedBrandId && !isNewBrand) {
      toast.error('Please select a brand');
      return;
    }

    if (isNewBrand && !newBrandData.brand_name.trim()) {
      toast.error('Please enter brand name');
      return;
    }

    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (unitCost <= 0) {
      toast.error('Please enter a valid unit cost');
      return;
    }

    const existingItem = cart.find(item =>
      item.product_name === productName.trim() &&
      item.brand_id === (selectedBrandId ? parseInt(selectedBrandId) : null) &&
      item.category_id === (selectedCategoryId ? parseInt(selectedCategoryId) : null)
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      setCart(cart.map(item =>
        item.product_name === productName.trim() &&
        item.brand_id === (selectedBrandId ? parseInt(selectedBrandId) : null) &&
        item.category_id === (selectedCategoryId ? parseInt(selectedCategoryId) : null)
          ? {
              ...item,
              quantity: newQuantity,
              line_total: newQuantity * item.unit_cost
            }
          : item
      ));
    } else {
      const categoryName = selectedCategoryId
        ? categories.find(c => c.category_id === parseInt(selectedCategoryId))?.category_name || 'Unknown'
        : newCategoryData.category_name;

      const brandName = selectedBrandId
        ? brands.find(b => b.brand_id === parseInt(selectedBrandId))?.brand_name || 'Unknown'
        : newBrandData.brand_name;

      const newItem: CartItem = {
        product_name: productName.trim(),
        brand_name: brandName,
        category_name: categoryName,
        quantity,
        unit_cost: unitCost,
        line_total: quantity * unitCost,
        brand_id: selectedBrandId ? parseInt(selectedBrandId) : 0,
        category_id: selectedCategoryId ? parseInt(selectedCategoryId) : 0
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setProductName('');
    setSelectedCategoryId('');
    setIsNewCategory(false);
    setNewCategoryData({ category_name: '', description: '' });
    setSelectedBrandId('');
    setIsNewBrand(false);
    setNewBrandData({ brand_name: '', description: '', unit_price: 0 });
    setQuantity(1);
    setUnitCost(0);
    toast.success('Product added to cart');
  };

  const handleRemoveFromCart = (productName: string, brandId: number, categoryId: number) => {
    setCart(cart.filter(item =>
      !(item.product_name === productName &&
        item.brand_id === brandId &&
        item.category_id === categoryId)
    ));
  };

  const handleQuantityChange = (productName: string, brandId: number, categoryId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productName, brandId, categoryId);
      return;
    }

    setCart(cart.map(item =>
      item.product_name === productName &&
      item.brand_id === brandId &&
      item.category_id === categoryId
        ? {
            ...item,
            quantity: newQuantity,
            line_total: newQuantity * item.unit_cost
          }
        : item
    ));
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierData.supplier_name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/suppliers/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSupplierData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers([...suppliers, data.supplier]);
        setSelectedSupplierId(data.supplier.supplier_id.toString());
        setIsNewSupplier(false);
        setNewSupplierData({
          supplier_name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: ''
        });
        toast.success('Supplier created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create supplier');
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.category_name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/categories/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCategoryData)
      });

      if (response.ok) {
        const data = await response.json();
        setCategories([...categories, data.category]);
        setSelectedCategoryId(data.category.category_id.toString());
        setIsNewCategory(false);
        setNewCategoryData({
          category_name: '',
          description: ''
        });
        toast.success('Category created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandData.brand_name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/brands/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBrandData)
      });

      if (response.ok) {
        const data = await response.json();
        setBrands([...brands, data.brand]);
        setSelectedBrandId(data.brand.brand_id.toString());
        setIsNewBrand(false);
        setNewBrandData({
          brand_name: '',
          description: '',
          unit_price: 0
        });
        toast.success('Brand created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand');
    }
  };

  const handleSubmitPurchase = async () => {
    if (!selectedSupplierId && !isNewSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add at least one product to the cart');
      return;
    }

    if (isNewSupplier && !newSupplierData.supplier_name.trim()) {
      toast.error('Please enter supplier name');
      return;
    }

    setLoading(true);

    try {
      let supplierId = selectedSupplierId;

      // Create new supplier if needed
      if (isNewSupplier) {
        const token = localStorage.getItem('access_token');
        const supplierResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/suppliers/${selectedBusiness}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSupplierData)
        });

        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();
          supplierId = supplierData.supplier.supplier_id.toString();
        } else {
          throw new Error('Failed to create supplier');
        }
      }

      // Create purchase order
      const token = localStorage.getItem('access_token');
      const purchaseData = {
        supplier_id: parseInt(supplierId),
        items: cart.map(item => ({
          product_name: item.product_name,
          brand_id: item.brand_id,
          brand_name: item.brand_name,
          category_id: item.category_id,
          category_name: item.category_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        })),
        notes: notes || null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/purchase-orders/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        const purchaseData = await response.json();
        setLastRecordedPurchase(purchaseData);
        setShowSuccessModal(true);
        setHighlightedPurchaseId(purchaseData.purchase_order.purchase_order_id);
        toast.success(`Purchase #${purchaseData.purchase_order.purchase_order_id} recorded successfully!`);
        // Reset form
        setSelectedSupplierId('');
        setIsNewSupplier(false);
        setNewSupplierData({
          supplier_name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: ''
        });
        setCart([]);
        setNotes('');
        // Refresh purchase history to show the new purchase
        fetchPurchaseHistory();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record purchase');
      }
    } catch (error) {
      console.error('Error recording purchase:', error);
      toast.error('Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingBusinesses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Record Purchase Order</h1>
            <p className="text-muted-foreground">Record purchases from suppliers and add to inventory</p>
          </div>
        </div>
      </div>

      {/* Business Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Business</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedBusiness}
            onChange={(e) => {
              const newBusinessId = e.target.value;
              setSelectedBusiness(newBusinessId);
              localStorage.setItem('selectedBusinessId', newBusinessId);
              // Clear all current data and reload
              setSuppliers([]);
              setProducts([]);
              setCategories([]);
              setBrands([]);
              setCart([]);
              setPurchaseHistory([]);
              setSelectedSupplierId('');
              setIsNewSupplier(false);
              setNewSupplierData({
                supplier_name: '',
                contact_person: '',
                email: '',
                phone: '',
                address: ''
              });
              setSelectedCategoryId('');
              setIsNewCategory(false);
              setNewCategoryData({ category_name: '', description: '' });
              setSelectedBrandId('');
              setIsNewBrand(false);
              setNewBrandData({ brand_name: '', description: '', unit_price: 0 });
              setProductName('');
              setQuantity(1);
              setUnitCost(0);
              setNotes('');
              setTotal(0);
            }}
          >
            <option value="">Select a Business</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedBusiness && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>Enter purchase information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supplier Selection */}
              <div className="space-y-2">
                <Label>Supplier</Label>
                {!isNewSupplier ? (
                  <div className="flex space-x-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.supplier_name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" onClick={() => setIsNewSupplier(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Supplier Name"
                        value={newSupplierData.supplier_name}
                        onChange={(e) => setNewSupplierData({...newSupplierData, supplier_name: e.target.value})}
                      />
                      <Button variant="outline" onClick={() => setIsNewSupplier(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Contact Person"
                      value={newSupplierData.contact_person}
                      onChange={(e) => setNewSupplierData({...newSupplierData, contact_person: e.target.value})}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newSupplierData.email}
                      onChange={(e) => setNewSupplierData({...newSupplierData, email: e.target.value})}
                    />
                    <Input
                      placeholder="Phone"
                      value={newSupplierData.phone}
                      onChange={(e) => setNewSupplierData({...newSupplierData, phone: e.target.value})}
                    />
                    <Textarea
                      placeholder="Address"
                      value={newSupplierData.address}
                      onChange={(e) => setNewSupplierData({...newSupplierData, address: e.target.value})}
                    />
                    <Button onClick={handleCreateSupplier} className="w-full">
                      Create Supplier
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <Label>Product Details</Label>

                <Input
                  placeholder="Product Name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />

                {/* Category Selection */}
                {!isNewCategory ? (
                  <div className="flex space-x-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" onClick={() => setIsNewCategory(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Category Name"
                        value={newCategoryData.category_name}
                        onChange={(e) => setNewCategoryData({...newCategoryData, category_name: e.target.value})}
                      />
                      <Button variant="outline" onClick={() => setIsNewCategory(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Description"
                      value={newCategoryData.description}
                      onChange={(e) => setNewCategoryData({...newCategoryData, description: e.target.value})}
                    />
                    <Button onClick={handleCreateCategory} className="w-full">
                      Create Category
                    </Button>
                  </div>
                )}

                {/* Brand Selection */}
                {!isNewBrand ? (
                  <div className="flex space-x-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.brand_id} value={brand.brand_id}>
                          {brand.brand_name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" onClick={() => setIsNewBrand(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Brand Name"
                        value={newBrandData.brand_name}
                        onChange={(e) => setNewBrandData({...newBrandData, brand_name: e.target.value})}
                      />
                      <Button variant="outline" onClick={() => setIsNewBrand(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Description"
                      value={newBrandData.description}
                      onChange={(e) => setNewBrandData({...newBrandData, description: e.target.value})}
                    />
                    <Input
                      placeholder="Unit Price"
                      type="number"
                      step="0.01"
                      value={newBrandData.unit_price}
                      onChange={(e) => setNewBrandData({...newBrandData, unit_price: parseFloat(e.target.value) || 0})}
                    />
                    <Button onClick={handleCreateBrand} className="w-full">
                      Create Brand
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Unit Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Button onClick={handleAddToCart} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cart and Summary */}
          <div className="space-y-6">
            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Cart</CardTitle>
                <CardDescription>Items to be purchased</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No items in cart</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.brand_name} • {item.category_name}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product_name, item.brand_id, item.category_id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product_name, item.brand_id, item.category_id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">${item.unit_cost.toFixed(2)} each</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.product_name, item.brand_id, item.category_id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes and Submit */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Purchase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about this purchase..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSubmitPurchase}
                  disabled={loading || cart.length === 0}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Record Purchase
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Purchase History */}
      {selectedBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>Recent purchase orders</CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No purchase orders found</p>
            ) : (
              <div className="space-y-4">
                {purchaseHistory.slice(0, 10).map((purchase) => (
                  <Card
                    key={purchase.purchase_order_id}
                    className={`cursor-pointer transition-colors ${
                      highlightedPurchaseId === purchase.purchase_order_id ? 'ring-2 ring-green-500' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedPurchase(purchase);
                      setShowPurchaseDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Purchase #{purchase.purchase_order_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {purchase.supplier.supplier_name} • {new Date(purchase.order_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            {purchase.purchase_order_items.length} item{purchase.purchase_order_items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={purchase.status === 'Delivered' ? 'default' : 'secondary'}>
                            {purchase.status}
                          </Badge>
                          <p className="font-bold mt-1">${purchase.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase Details Modal */}
      {showPurchaseDetails && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Purchase #{selectedPurchase.purchase_order_id}</CardTitle>
                  <CardDescription>
                    {new Date(selectedPurchase.order_date).toLocaleDateString()} • 
                    Supplier: {selectedPurchase.supplier.supplier_name}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setShowPurchaseDetails(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedPurchase.status === 'Delivered' ? 'default' : 'secondary'}>
                    {selectedPurchase.status}
                  </Badge>
                </div>
                <div>
                  <Label>Delivery Date</Label>
                  <p>{new Date(selectedPurchase.delivery_date).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedPurchase.notes}</p>
                </div>
              )}

              <div>
                <Label>Items Purchased</Label>
                <div className="space-y-2 mt-2">
                  {selectedPurchase.purchase_order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.product_brand.brand_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity_ordered} • Unit Cost: ${item.unit_cost.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-lg">${selectedPurchase.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastRecordedPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-green-600">Purchase Recorded Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-lg font-semibold">Purchase #{lastRecordedPurchase.purchase_order.purchase_order_id}</p>
                <p className="text-muted-foreground">
                  Total: ${lastRecordedPurchase.purchase_order.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {lastRecordedPurchase.total_items_added} item(s) added to inventory
                </p>
              </div>
              <Button onClick={() => setShowSuccessModal(false)} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
