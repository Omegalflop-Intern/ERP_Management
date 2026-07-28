import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Trash2,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Banknote,
  RefreshCw,
  Percent,
  UserPlus,
  Plus,
  X,
  Package,
  Wand2,
  Gift,
  Tag,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

export default function SalesForm() {
  const navigate = useNavigate();
  const { styled } = useTheme();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [discount, setDiscount] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [payment, setPayment] = useState({ cash: '', bkash: '', rocket: '', nagad: '', bank: '' });
  const [showCustomerCreate, setShowCustomerCreate] = useState(false);
  const [showProductCreate, setShowProductCreate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { data: imeiResults, isLoading: searchingImei } = useQuery({
    queryKey: ['imei-search', searchQuery],
    queryFn: async () => {
      const { data } = await api.get('/inventory', {
        params: { search: searchQuery, status: 'Available', limit: 20 },
      });
      return data?.data || [];
    },
    enabled: isFocused || searchQuery.length > 0,
  });

  const { data: productResults, isLoading: searchingProducts } = useQuery({
    queryKey: ['product-search-pos', searchQuery],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { search: searchQuery || '', limit: 20 },
      });
      return (data?.data || []).filter((p) => (p.stockQuantity ?? 0) > 0 && p.isActive !== false);
    },
    enabled: isFocused || searchQuery.length > 0,
  });

  const searching = searchingImei || searchingProducts;
  // Merge: IMEI units first, then stockQty products (exclude those already covered by IMEI units)
  const imeiProductIds = new Set(
    (imeiResults || []).map((u) => u.productId?._id?.toString() || u.productId?.toString())
  );
  const bulkProducts = (productResults || []).filter((p) => !imeiProductIds.has(p._id?.toString()));
  const searchResults = [
    ...(imeiResults || []),
    ...bulkProducts.map((p) => ({
      _id: p._id,
      isBulk: true,
      productId: p,
      imeiOrSerial: '',
      currentSellingPrice: p.sellingPrice,
      purchasePrice: p.costPrice,
      stockQuantity: p.stockQuantity,
    })),
  ];

  const [isCustomerFocused, setIsCustomerFocused] = useState(false);

  const { data: customerSearch } = useQuery({
    queryKey: ['customer-search', customerPhone, customerName, isCustomerFocused],
    queryFn: async () => {
      const queryTerm = customerPhone || customerName || '';
      const { data } = await api.get('/customers', { params: { search: queryTerm, limit: 15 } });
      return data?.data || [];
    },
    enabled:
      (isCustomerFocused || customerPhone.length >= 2 || customerName.length >= 2) && !customerId,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/customers', payload);
      return data.data;
    },
    onSuccess: (customer) => {
      setCustomerId(customer._id);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email || '');
      setCustomerAddress(customer.address || '');
      setShowCustomerCreate(false);
      toast.success(`Customer "${customer.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['customer-search'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create customer'),
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/products', payload);
      return data.data;
    },
    onSuccess: (product) => {
      toast.success(`Product "${product.name}" created`);
      setShowProductCreate(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create product'),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (saleData) => api.post('/sales', saleData),
    onSuccess: (res) => {
      toast.success('Sale completed!');
      navigate(`/sales/${res.data.data._id}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Checkout failed'),
  });

  const addToCart = (item) => {
    const maxStock = item.stockQuantity ?? item.productId?.stockQuantity;
    if (maxStock !== undefined && maxStock <= 0) {
      toast.error(`"${item.productId?.name || item.description || 'Item'}" is out of stock!`);
      return;
    }

    const prodObj = item.productId && typeof item.productId === 'object' ? item.productId : null;
    const retailPrice = item.currentSellingPrice || item.sellingPrice || prodObj?.sellingPrice || 0;
    const wholesalePrice = prodObj?.wholesalePrice || item.wholesalePrice || 0;
    const isB2B = selectedCustomerObj?.customerType === 'B2B';
    const unitPrice = isB2B && wholesalePrice > 0 ? wholesalePrice : retailPrice;

    const formatDesc = (brand, name) => {
      const b = (brand || '').trim();
      const n = (name || '').trim();
      if (!b) return n;
      if (n.toLowerCase().startsWith(b.toLowerCase())) return n;
      return `${b} ${n}`;
    };

    if (item.isBulk) {
      // Bulk product (stockQuantity-based, no IMEI)
      const existing = cart.find((c) => c.productId === (item.productId?._id || item.productId));
      if (existing) {
        if (maxStock !== undefined && existing.qty >= maxStock) {
          toast.warning(`Stock limit reached! Available: ${maxStock} pcs`);
          return;
        }
        setCart(
          cart.map((c) =>
            c.productId === (item.productId?._id || item.productId) ? { ...c, qty: c.qty + 1 } : c
          )
        );
        setSearchQuery('');
        return;
      }

      setCart([
        ...cart,
        {
          productId: item.productId?._id || item.productId,
          description: formatDesc(item.productId?.brand, item.productId?.name),
          imeiOrSerial: '',
          qty: 1,
          unitPrice,
          retailPrice,
          wholesalePrice,
          isBulk: true,
          maxQty: maxStock ?? 999,
        },
      ]);
      setSearchQuery('');
      return;
    }

    // IMEI-based item
    const existing = cart.find((c) => c.imeiOrSerial === item.imeiOrSerial);
    if (existing) {
      toast.warning('Already in cart');
      return;
    }

    setCart([
      ...cart,
      {
        productId: item.productId?._id || item.productId,
        description: formatDesc(item.productId?.brand, item.productId?.name || item.productName),
        imeiOrSerial: item.imeiOrSerial,
        qty: 1,
        unitPrice,
        retailPrice,
        wholesalePrice,
        maxQty: 1,
      },
    ]);
    setSearchQuery('');
  };

  const addManualItem = () => {
    setCart([
      ...cart,
      {
        productId: '',
        description: '',
        imeiOrSerial: '',
        qty: 1,
        unitPrice: 0,
        isManual: true,
      },
    ]);
  };

  const updateCartItem = (index, field, value) => {
    const updated = [...cart];
    const item = updated[index];
    if (field === 'qty') {
      const newQty = Number(value) || 1;
      const maxStock = item.maxQty;
      if (maxStock !== undefined && maxStock !== null && newQty > maxStock) {
        toast.warning(`Cannot exceed available stock limit (${maxStock} pcs)`);
        updated[index] = { ...item, qty: maxStock };
        setCart(updated);
        return;
      }
      updated[index] = { ...item, qty: newQty };
      setCart(updated);
      return;
    }
    updated[index] = { ...item, [field]: value };
    setCart(updated);
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const subTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const discountAmount = Number(discount) || 0;
  const afterDiscount = subTotal - discountAmount;
  const vatAmount = afterDiscount * ((Number(vatRate) || 0) / 100);
  const netTotal = afterDiscount + vatAmount;
  const paidAmount =
    (Number(payment.cash) || 0) +
    (Number(payment.bkash) || 0) +
    (Number(payment.rocket) || 0) +
    (Number(payment.nagad) || 0) +
    (Number(payment.bank) || 0);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

  const updateCartPricesForCustomer = (customerObj) => {
    const isB2B = customerObj?.customerType === 'B2B';
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.isManual) return item;
        const targetPrice =
          isB2B && item.wholesalePrice > 0 ? item.wholesalePrice : item.retailPrice;
        return targetPrice !== undefined && targetPrice !== null && targetPrice > 0
          ? { ...item, unitPrice: targetPrice }
          : item;
      })
    );
    if (isB2B) {
      toast.info(`Applied B2B Dealer Wholesale Prices for ${customerObj.name}`);
    }
  };

  const selectCustomer = (c) => {
    setCustomerId(c._id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerEmail(c.email || '');
    setCustomerAddress(c.address || '');
    setSelectedCustomerObj(c);
    updateCartPricesForCustomer(c);
  };

  const clearCustomer = () => {
    setCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setSelectedCustomerObj(null);
    updateCartPricesForCustomer(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (netTotal <= 0) return toast.error('Total must be greater than 0');
    if (dueAmount > 0 && !customerPhone)
      return toast.error('Customer phone required for due amount');

    checkoutMutation.mutate({
      customerId: customerId || undefined,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      customerEmail,
      customerAddress,
      saleType: selectedCustomerObj?.customerType === 'B2B' ? 'WHOLESALE' : 'RETAIL',
      items: cart.map((c) => ({
        productId: c.productId,
        imeiOrSerial: c.imeiOrSerial,
        description: c.description,
        qty: c.qty,
        unitPrice: c.unitPrice,
      })),
      discount: discountAmount,
      tax: vatAmount,
      paymentBreakdown: {
        cash: Number(payment.cash) || 0,
        bkash: Number(payment.bkash) || 0,
        rocket: Number(payment.rocket) || 0,
        nagad: Number(payment.nagad) || 0,
        bank: Number(payment.bank) || 0,
        dueAmount,
      },
    });
  };

  const inputCls = styled
    ? 'neu-input px-3 py-2 text-sm'
    : 'px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';
  const cardCls = styled
    ? 'neu-card rounded-xl'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Sale</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Scan IMEI or search products to add to cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product Search + Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className={`${cardCls} p-4`}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Click or type to search by IMEI, product name, brand, model, SKU..."
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsFocused(true);
                }}
                className={`w-full pl-10 pr-4 py-2.5 ${inputCls}`}
              />
            </div>

            {(isFocused || searchQuery) && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#111827] shadow-lg">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                  <span>Products ({searchResults?.length || 0})</span>
                  <button
                    onClick={() => setIsFocused(false)}
                    className="hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    Close
                  </button>
                </div>
                {searching ? (
                  <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                    Searching products...
                  </div>
                ) : searchResults?.length > 0 ? (
                  searchResults.map((item) => {
                    const isB2B = selectedCustomerObj?.customerType === 'B2B';
                    const prodObj =
                      item.productId && typeof item.productId === 'object' ? item.productId : null;
                    const retailPrice =
                      item.currentSellingPrice || item.sellingPrice || prodObj?.sellingPrice || 0;
                    const wholesalePrice = prodObj?.wholesalePrice || item.wholesalePrice || 0;
                    const isWholesaleApplied = isB2B && wholesalePrice > 0;
                    const displayPrice = isWholesaleApplied ? wholesalePrice : retailPrice;

                    return (
                      <button
                        key={item._id + (item.imeiOrSerial || 'bulk')}
                        onClick={() => {
                          addToCart(item);
                          setIsFocused(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                            {item.productId?.brand} {item.productId?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                            {item.isBulk ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                                Stock Item
                              </span>
                            ) : (
                              <span>IMEI: {item.imeiOrSerial}</span>
                            )}
                            {item.warrantyMonths && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                                {item.warrantyMonths}m Warranty
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                            ৳{displayPrice?.toLocaleString()}
                            {isWholesaleApplied && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-sans font-bold">
                                B2B Rate
                              </span>
                            )}
                          </div>
                          {isWholesaleApplied && retailPrice > wholesalePrice && (
                            <div className="text-[10px] text-gray-400 line-through">
                              Retail: ৳{retailPrice.toLocaleString()}
                            </div>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            <Package className="w-3 h-3 text-emerald-500" />{' '}
                            {item.isBulk
                              ? item.stockQuantity || item.productId?.stockQuantity || 0
                              : item.productStockCount || 1}{' '}
                            in stock
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No products found matching "
                    <span className="font-semibold text-gray-300">{searchQuery}</span>"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Product Button */}
          <button
            onClick={() => setShowProductCreate(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all ${cardCls}`}
          >
            <Plus className="w-4 h-4" /> Quick Add New Product
          </button>

          {/* Cart */}
          <div className={`${cardCls} overflow-hidden`}>
            <div
              className={`px-4 py-3 flex items-center justify-between ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Cart ({cart.length})
              </h3>
              <button
                onClick={addManualItem}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                + Add manually
              </button>
            </div>

            {/* Free Gift Promo Reminder Banner (PDF Spec 3.2) */}
            {cart.length > 0 && (
              <div className="mx-4 my-2 p-2.5 bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    🎁 Free Gift Promo Reminder:
                  </span>
                  <span className="ml-1">
                    Remind cashier to offer free screen protector, back cover or gift box for device
                    purchase!
                  </span>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search and add products to cart</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {cart.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      {item.isManual ? (
                        <input
                          value={item.description}
                          onChange={(e) => updateCartItem(i, 'description', e.target.value)}
                          placeholder="Product description"
                          className={`w-full px-2 py-1 ${inputCls}`}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 font-mono">
                        {item.imeiOrSerial || 'No IMEI'}
                      </div>
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        value={item.qty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateCartItem(i, 'qty', Number(e.target.value))}
                        min={1}
                        className={`w-full px-2 py-1 text-center ${inputCls}`}
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateCartItem(i, 'unitPrice', Number(e.target.value))}
                        min={0}
                        className={`w-full px-2 py-1 text-right ${inputCls}`}
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      ৳{(item.unitPrice * item.qty).toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeFromCart(i)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Payment */}
        <div className="space-y-4">
          {/* Customer */}
          <div className={`${cardCls} p-4 space-y-3 relative z-30`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Customer Info
              </h3>
              {customerId ? (
                <button
                  onClick={clearCustomer}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              ) : (
                <button
                  onClick={() => setShowCustomerCreate(true)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" /> New
                </button>
              )}
            </div>

            {customerId ? (
              <div className="px-3.5 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/30 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                    {customerName || 'Customer'}
                    {selectedCustomerObj?.companyName && (
                      <span className="text-xs font-normal text-green-700 dark:text-green-400">
                        ({selectedCustomerObj.companyName})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                      selectedCustomerObj?.customerType === 'B2B'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30'
                    }`}
                  >
                    {selectedCustomerObj?.customerType === 'B2B' ? 'B2B Dealer' : 'Retail Customer'}
                  </span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-mono">
                  {customerPhone}
                </div>
                {customerEmail && (
                  <div className="text-xs text-green-600 dark:text-green-400">{customerEmail}</div>
                )}
                {customerAddress && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {customerAddress}
                  </div>
                )}
                {selectedCustomerObj?.dueBalance > 0 && (
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 pt-1 border-t border-green-200/60 dark:border-green-500/20">
                    Existing Due: ৳{selectedCustomerObj.dueBalance.toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 relative">
                <input
                  type="text"
                  placeholder="Customer name (click/type to select existing)"
                  value={customerName}
                  onFocus={() => setIsCustomerFocused(true)}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setIsCustomerFocused(true);
                  }}
                  className={`w-full ${inputCls}`}
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={customerPhone}
                    onFocus={() => setIsCustomerFocused(true)}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setCustomerId(null);
                      setIsCustomerFocused(true);
                    }}
                    className={`w-full ${inputCls}`}
                  />

                  {/* Existing Customer Selector Dropdown */}
                  {isCustomerFocused && customerSearch?.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/90 dark:bg-gray-900/90 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
                        <span>Select Existing Customer ({customerSearch.length})</span>
                        <button
                          onClick={() => setIsCustomerFocused(false)}
                          className="hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                        >
                          Close
                        </button>
                      </div>
                      {customerSearch.map((c) => {
                        const isB2B = c.customerType === 'B2B';
                        return (
                          <button
                            key={c._id}
                            onClick={() => {
                              selectCustomer(c);
                              setIsCustomerFocused(false);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-red-500">
                                {c.name}
                                {c.companyName && (
                                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">
                                    • {c.companyName}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                                  isB2B
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                }`}
                              >
                                {isB2B ? 'B2B Dealer' : 'Retail'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{c.phone}</div>
                            {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                            {c.dueBalance > 0 && (
                              <div className="text-[11px] font-bold text-red-500 mt-0.5">
                                Outstanding Due: ৳{c.dueBalance.toLocaleString()}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
              </div>
            )}
          </div>

          {/* Discount & VAT */}
          <div className={`${cardCls} p-4 space-y-3`}>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <span>Discount &amp; Tax</span>
              <span className="text-xs font-normal text-amber-500 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Promo / Gift Cards
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Discount (৳)</label>
                <input
                  type="number"
                  value={discount}
                  placeholder="0"
                  min={0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDiscount(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase flex items-center gap-1">
                  <Percent className="w-3 h-3" /> VAT %
                </label>
                <input
                  type="number"
                  value={vatRate}
                  placeholder="0"
                  min={0}
                  max={100}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setVatRate(e.target.value)}
                  className={`w-full ${inputCls}`}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-500" /> Promo Code / Gift Card
              </label>
              <input
                type="text"
                placeholder="Enter Coupon or Gift Card Code (e.g. GIFT500)"
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  if (code === 'GIFT500' || code === 'PROMO500') {
                    setDiscount(500);
                    toast.success(`Promo Code "${code}" applied: ৳500 Discount!`);
                  }
                }}
                className={`w-full ${inputCls} font-mono uppercase`}
              />
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className={`${cardCls} p-4 space-y-3`}>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Payment</h3>
            <div className="space-y-2">
              {[
                { key: 'cash', icon: Banknote, color: 'text-green-500', placeholder: 'Cash' },
                { key: 'bkash', icon: Smartphone, color: 'text-pink-500', placeholder: 'bKash' },
                {
                  key: 'rocket',
                  icon: Smartphone,
                  color: 'text-purple-500',
                  placeholder: 'Rocket',
                },
                { key: 'nagad', icon: Smartphone, color: 'text-yellow-500', placeholder: 'Nagad' },
                { key: 'bank', icon: CreditCard, color: 'text-blue-500', placeholder: 'Bank/Card' },
              ].map(({ key, icon: Icon, color, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={payment[key]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPayment({ ...payment, [key]: e.target.value })}
                    className={`flex-1 ${inputCls}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className={`${cardCls} p-4 space-y-2`}>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>৳{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-৳{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>VAT ({vatRate}%)</span>
                <span>+৳{Math.round(vatAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-800 pt-2">
              <span>Total</span>
              <span>৳{Math.round(netTotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Paid</span>
              <span>৳{paidAmount.toLocaleString()}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>Due</span>
                <span>৳{Math.round(dueAmount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending || cart.length === 0}
            className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-700/20"
          >
            {checkoutMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Complete Sale'
            )}
          </button>
        </div>
      </div>

      {/* Inline Customer Create Modal */}
      {showCustomerCreate && (
        <InlineCustomerModal
          defaultName={customerName}
          defaultPhone={customerPhone}
          onClose={() => setShowCustomerCreate(false)}
          onCreate={(data) => createCustomerMutation.mutate(data)}
          isPending={createCustomerMutation.isPending}
          styled={styled}
          inputCls={inputCls}
        />
      )}

      {/* Inline Product Create Modal */}
      {showProductCreate && (
        <InlineProductModal
          onClose={() => setShowProductCreate(false)}
          onCreate={(data) => createProductMutation.mutate(data)}
          isPending={createProductMutation.isPending}
          styled={styled}
          inputCls={inputCls}
        />
      )}
    </div>
  );
}

function InlineCustomerModal({
  defaultName,
  defaultPhone,
  onClose,
  onCreate,
  isPending,
  styled,
  inputCls,
}) {
  const [form, setForm] = useState({
    name: defaultName || '',
    phone: defaultPhone || '',
    email: '',
    address: '',
    customerType: 'INDIVIDUAL',
    companyName: '',
    binOrTaxId: '',
  });
  const cardCls = styled
    ? 'neu-card rounded-2xl'
    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${cardCls} w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div
          className={`px-6 py-4 flex items-center justify-between ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
        >
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> New Customer
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(form);
          }}
          className="p-6 space-y-3 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Customer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, customerType: 'INDIVIDUAL' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                  form.customerType === 'INDIVIDUAL'
                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Individual Retail
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, customerType: 'B2B' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                  form.customerType === 'B2B'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                B2B Dealer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Full Name / Contact Person *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full ${inputCls}`}
            />
          </div>

          {form.customerType === 'B2B' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Company / Shop Name
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. M/S Rahat Telecom"
                  className={`w-full ${inputCls}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Trade License / BIN / Tax ID
                </label>
                <input
                  value={form.binOrTaxId}
                  onChange={(e) => setForm({ ...form, binOrTaxId: e.target.value })}
                  placeholder="e.g. BIN-0098483-2"
                  className={`w-full ${inputCls}`}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Phone *
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full ${inputCls}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Address
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`w-full ${inputCls}`}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {isPending ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InlineProductModal({ onClose, onCreate, isPending, styled, inputCls }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: 'SMARTPHONE',
    sku: '',
    costPrice: '',
    sellingPrice: '',
    imeiOrSerial: '',
    ram: '',
    storage: '',
    color: '',
  });
  const cardCls = styled
    ? 'neu-card rounded-2xl'
    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl';

  const { data: catList } = useQuery({
    queryKey: ['catalog', 'CATEGORY'],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: 'CATEGORY' } });
      return data.data || [];
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${cardCls} w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div
          className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
        >
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" /> Quick Add Product
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              ...form,
              costPrice: Number(form.costPrice),
              sellingPrice: Number(form.sellingPrice),
              minStockAlert: 2,
            });
          }}
          className="p-6 space-y-3 text-sm"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Product Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Brand *
              </label>
              <input
                required
                value={form.brand}
                onChange={(e) => {
                  const brandVal = e.target.value;
                  setForm((prev) => {
                    const updated = { ...prev, brand: brandVal };
                    if (!prev.sku) {
                      const prefix =
                        brandVal
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, '')
                          .slice(0, 8) || 'PROD';
                      const random6 = Math.floor(100000 + Math.random() * 900000);
                      updated.sku = `${prefix}-${random6}`;
                    }
                    return updated;
                  });
                }}
                className={`w-full ${inputCls}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Category *
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="pos-cat-list"
                placeholder="Type or select"
                className={`w-full ${inputCls}`}
              />
              <datalist id="pos-cat-list">
                {(catList || []).map((c) => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  SKU
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const prefix =
                      (form.brand || 'PROD')
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 8) || 'PROD';
                    const random6 = Math.floor(100000 + Math.random() * 900000);
                    setForm((prev) => ({ ...prev, sku: `${prefix}-${random6}` }));
                  }}
                  className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <Wand2 className="w-2.5 h-2.5" /> Auto
                </button>
              </div>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="Auto if empty"
                className={`w-full ${inputCls} font-mono`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Device IMEI / Serial (Optional)
            </label>
            <input
              value={form.imeiOrSerial}
              onChange={(e) => setForm({ ...form, imeiOrSerial: e.target.value })}
              placeholder="15-digit IMEI number"
              className={`w-full ${inputCls} font-mono`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Cost Price (৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className={`w-full ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Selling Price (৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className={`w-full ${inputCls}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                RAM
              </label>
              <input
                value={form.ram}
                onChange={(e) => setForm({ ...form, ram: e.target.value })}
                placeholder="8GB"
                className={`w-full ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Storage
              </label>
              <input
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: e.target.value })}
                placeholder="256GB"
                className={`w-full ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Color
              </label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className={`w-full ${inputCls}`}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
