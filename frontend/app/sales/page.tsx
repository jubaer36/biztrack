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
import { SearchableProductSelect } from "@/components/SearchableProductSelect";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  customer_type: string;
}

interface Product {
  product_name: string;
  brand_name: string;
  category_name: string;
  selling_price: number;
  price: number;
  brand_id: number;
  category_id: number;
  stock_count: number;
  product_ids: string[];
}

interface CartItem {
  product_name: string;
  brand_name: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_ids: string[]; // Will use the first available product_id for now
}

interface SalesOrder {
  order_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  customer: {
    customer_name: string;
    email: string;
    phone: string;
  };
  sales_order_items: Array<{
    product_id: string;
    line_total: number;
    product: {
      product_name: string;
      selling_price: number;
    };
  }>;
}

export default function RecordSalePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [salesHistory, setSalesHistory] = useState<SalesOrder[]>([]);
  const [selectedSale, setSelectedSale] = useState<SalesOrder | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [lastRecordedSale, setLastRecordedSale] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [highlightedSaleId, setHighlightedSaleId] = useState<number | null>(null);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: '',
    customer_type: 'regular'
  });
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

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
      fetchCustomers();
      fetchProducts();
      fetchSalesHistory();
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

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/customers/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/products/${selectedBusiness}`, {
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

  const fetchSalesHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSalesHistory(data.sales_orders || []);
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('Failed to load sales history');
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and valid quantity');
      return;
    }

    if (quantity > selectedProduct.stock_count) {
      toast.error(`Only ${selectedProduct.stock_count} items available in stock`);
      return;
    }

    const existingItem = cart.find(item =>
      item.product_name === selectedProduct.product_name &&
      item.brand_name === selectedProduct.brand_name &&
      item.category_name === selectedProduct.category_name
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > selectedProduct.stock_count) {
        toast.error(`Cannot add more items. Only ${selectedProduct.stock_count} items available in stock`);
        return;
      }
      // Update quantity
      setCart(cart.map(item =>
        item.product_name === selectedProduct.product_name &&
        item.brand_name === selectedProduct.brand_name &&
        item.category_name === selectedProduct.category_name
          ? {
              ...item,
              quantity: newQuantity,
              line_total: newQuantity * item.unit_price
            }
          : item
      ));
    } else {
      // Add new item
      const newItem: CartItem = {
        product_name: selectedProduct.product_name,
        brand_name: selectedProduct.brand_name,
        category_name: selectedProduct.category_name,
        quantity,
        unit_price: selectedProduct.selling_price,
        line_total: quantity * selectedProduct.selling_price,
        product_ids: selectedProduct.product_ids
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    toast.success('Product added to cart');
  };

  const handleRemoveFromCart = (productName: string, brandName: string, categoryName: string) => {
    setCart(cart.filter(item =>
      !(item.product_name === productName &&
        item.brand_name === brandName &&
        item.category_name === categoryName)
    ));
  };

  const handleQuantityChange = (productName: string, brandName: string, categoryName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productName, brandName, categoryName);
      return;
    }

    const product = products.find(p =>
      p.product_name === productName &&
      p.brand_name === brandName &&
      p.category_name === categoryName
    );

    if (product && newQuantity > product.stock_count) {
      toast.error(`Cannot exceed available stock of ${product.stock_count} items`);
      return;
    }

    setCart(cart.map(item =>
      item.product_name === productName &&
      item.brand_name === brandName &&
      item.category_name === categoryName
        ? {
            ...item,
            quantity: newQuantity,
            line_total: newQuantity * item.unit_price
          }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.line_total, 0);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/customers/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomerData)
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers([...customers, data.customer]);
        setSelectedCustomerId(data.customer.customer_id.toString());
        setIsNewCustomer(false);
        setNewCustomerData({
          customer_name: '',
          email: '',
          phone: '',
          billing_address: '',
          shipping_address: '',
          customer_type: 'regular'
        });
        toast.success('Customer created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const handleSubmitSale = async () => {
    if (!selectedCustomerId && !isNewCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add at least one product to the cart');
      return;
    }

    if (isNewCustomer && !newCustomerData.customer_name.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    setLoading(true);

    try {
      let customerId = selectedCustomerId;

      // Create new customer if needed
      if (isNewCustomer) {
        const token = localStorage.getItem('access_token');
        const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/customers/${selectedBusiness}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newCustomerData)
        });

        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          customerId = customerData.customer.customer_id.toString();
        } else {
          throw new Error('Failed to create customer');
        }
      }

      // Create sales order
      const token = localStorage.getItem('access_token');
      const saleData = {
        customer_id: parseInt(customerId),
        items: cart.map(item => ({
          product_id: item.product_ids[0], // Use first available product_id
          quantity: item.quantity
        })),
        shipping_address: shippingAddress || null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sales/${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const saleData = await response.json();
        setLastRecordedSale(saleData);
        setShowSuccessModal(true);
        setHighlightedSaleId(saleData.sales_order.order_id);
        toast.success(`Sale #${saleData.sales_order.order_id} recorded successfully!`);
        // Reset form
        setSelectedCustomerId('');
        setIsNewCustomer(false);
        setNewCustomerData({
          customer_name: '',
          email: '',
          phone: '',
          billing_address: '',
          shipping_address: '',
          customer_type: 'regular'
        });
        setCart([]);
        setShippingAddress('');
        // Refresh sales history to show the new sale
        fetchSalesHistory();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record sale');
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Business Selector */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Record Sale</h1>
                <p className="text-sm text-muted-foreground">Create a new sales transaction</p>
              </div>
            </div>

            {/* Business Selector */}
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              <select
                value={selectedBusiness}
                onChange={(e) => {
                  const newBusinessId = e.target.value;
                  if (newBusinessId !== selectedBusiness) {
                    // Store the selected business ID before reload
                    localStorage.setItem('selectedBusinessId', newBusinessId);
                    setSelectedBusiness(newBusinessId);
                    window.location.reload();
                  }
                }}
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

      <div className="max-w-6xl mx-auto p-4">
        {!selectedBusiness ? (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please select a business to record a sale
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    Select an existing customer or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={!isNewCustomer ? "default" : "outline"}
                      onClick={() => setIsNewCustomer(false)}
                      className="flex-1"
                    >
                      Existing Customer
                    </Button>
                    <Button
                      variant={isNewCustomer ? "default" : "outline"}
                      onClick={() => setIsNewCustomer(true)}
                      className="flex-1"
                    >
                      New Customer
                    </Button>
                  </div>

                  {!isNewCustomer ? (
                    <div>
                      <Label htmlFor="customer">Select Customer</Label>
                      <select
                        id="customer"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Choose a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.customer_id} value={customer.customer_id.toString()}>
                            {customer.customer_name} {customer.email && `(${customer.email})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name *</Label>
                        <Input
                          id="customer_name"
                          value={newCustomerData.customer_name}
                          onChange={(e) => setNewCustomerData({...newCustomerData, customer_name: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                            placeholder="customer@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billing_address">Billing Address</Label>
                        <Textarea
                          id="billing_address"
                          value={newCustomerData.billing_address}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_address: e.target.value})}
                          placeholder="Enter billing address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping_address">Shipping Address</Label>
                        <Textarea
                          id="shipping_address"
                          value={newCustomerData.shipping_address}
                          onChange={(e) => setNewCustomerData({...newCustomerData, shipping_address: e.target.value})}
                          placeholder="Enter shipping address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_type">Customer Type</Label>
                        <select
                          id="customer_type"
                          value={newCustomerData.customer_type}
                          onChange={(e) => setNewCustomerData({...newCustomerData, customer_type: e.target.value})}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="regular">Regular</option>
                          <option value="premium">Premium</option>
                          <option value="wholesale">Wholesale</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="order_shipping">Shipping Address for Order</Label>
                    <Textarea
                      id="order_shipping"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter shipping address for this order"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Selection and Cart */}
              <div className="space-y-6">
                {/* Product Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Add Products
                    </CardTitle>
                    <CardDescription>
                      Select products and quantities for this sale
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="product">Select Product</Label>
                      <SearchableProductSelect
                        products={products}
                        selectedProduct={selectedProduct}
                        onProductSelect={setSelectedProduct}
                        placeholder="Search products..."
                      />
                      {selectedProduct && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-800">
                              <strong>{selectedProduct.product_name}</strong> - {selectedProduct.stock_count} in stock
                            </span>
                            <span className="text-blue-600 font-semibold">
                              ${selectedProduct.selling_price} each
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <Button onClick={handleAddToCart} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>

                {/* Cart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart ({cart.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No items in cart</p>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={`${item.product_name}-${item.brand_name}-${item.category_name}`} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.product_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.brand_name}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.category_name}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">${item.unit_price} each</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.product_name, item.brand_name, item.category_name, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.product_name, item.brand_name, item.category_name, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromCart(item.product_name, item.brand_name, item.category_name)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Separator />

                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            onClick={handleSubmitSale}
                            disabled={loading}
                            className="flex-1"
                            size="lg"
                          >
                            {loading ? 'Recording Sale...' : 'Record Sale'}
                          </Button>
                          {isNewCustomer && (
                            <Button
                              variant="outline"
                              onClick={handleCreateCustomer}
                              disabled={!newCustomerData.customer_name.trim()}
                            >
                              Create Customer Only
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sales History Section */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recent Sales History
                  </CardTitle>
                  <CardDescription>
                    View your recent sales transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
                  ) : (
                    <div className="space-y-4">
                      {salesHistory.slice(0, 10).map((sale, index) => (
                        <div
                          key={`sale-${sale.order_id || index}`}
                          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                            highlightedSaleId === sale.order_id ? 'ring-2 ring-green-500 bg-green-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowSaleDetails(true);
                            setHighlightedSaleId(null);
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-semibold">Order #{sale.order_id}</h4>
                                <p className="text-sm text-gray-600">
                                  {sale.customer.customer_name}
                                  {sale.customer.email && ` (${sale.customer.email})`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(sale.order_date).toLocaleDateString()} at {new Date(sale.order_date).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">${sale.total_amount.toFixed(2)}</p>
                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {salesHistory.length > 10 && (
                        <p className="text-center text-sm text-gray-500 mt-4">
                          Showing 10 most recent sales. Click on any sale to view details.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Sales Details Modal */}
      {showSaleDetails && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Sale Details - Order #{selectedSale.order_id}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSaleDetails(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Order Date:</span>
                      <span>{new Date(selectedSale.order_date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedSale.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedSale.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-lg">${selectedSale.total_amount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{selectedSale.customer.customer_name}</span>
                    </div>
                    {selectedSale.customer.email && (
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{selectedSale.customer.email}</span>
                      </div>
                    )}
                    {selectedSale.customer.phone && (
                      <div className="flex justify-between">
                        <span className="font-medium">Phone:</span>
                        <span>{selectedSale.customer.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                {selectedSale.shipping_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{selectedSale.shipping_address}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedSale.sales_order_items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.product.product_name}</h4>
                            <p className="text-sm text-gray-600">
                              ${item.product.selling_price} each × {(item.line_total / item.product.selling_price).toFixed(0)} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowSaleDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && lastRecordedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">Sale Recorded Successfully!</h2>
              <p className="text-gray-600 text-center mb-4">
                Order #{lastRecordedSale.sales_order.order_id} has been saved to the database.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Order ID:</span>
                    <span>#{lastRecordedSale.sales_order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span>${lastRecordedSale.sales_order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Items:</span>
                    <span>{lastRecordedSale.items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(lastRecordedSale.sales_order.order_date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setLastRecordedSale(null);
                    setHighlightedSaleId(null);
                  }}
                  className="flex-1"
                >
                  Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Find and show the newly recorded sale in details
                    const newSale = salesHistory.find(sale => sale.order_id === lastRecordedSale.sales_order.order_id);
                    if (newSale) {
                      setSelectedSale(newSale);
                      setShowSaleDetails(true);
                    }
                    setShowSuccessModal(false);
                    setLastRecordedSale(null);
                    setHighlightedSaleId(null);
                  }}
                  className="flex-1"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}