import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Layers,
  CreditCard,
  UtensilsCrossed,
  ChefHat,
  Wallet,
  User,
  Phone,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';

import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import toppingService from '../../../services/toppingService';
import orderService from '../../../services/orderService';
import paymentService from '../../../services/paymentService'; 
import customerService from '../../../services/customerService';

interface ProductSize {
  id: number;
  sizeName: string;
  extraPrice: number;
}

interface Product {
  id: number;
  name: string;
  image: string;
  description: string;
  basePrice: number;
  price?: number; 
  categoryId: number;
  status: string;
  sizes?: ProductSize[];
}

interface Category {
  id: number;
  name: string;
  image?: string;
}

interface Topping {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface CartItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  image?: string;
  sizeId?: number;
  sizeName?: string;
  toppings: string[];
  price: number; 
}

export function QRMenu() {
  const { tableId } = useParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);

  const [paymentPreference, setPaymentPreference] = useState<string>('PAY_LATER'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE THÔNG TIN KHÁCH HÀNG TÍCH ĐIỂM
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState<boolean>(false);
  const [foundCustomer, setFoundCustomer] = useState<any | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);

  // FETCH DATA GỐC
  useEffect(() => {
    fetchData();
    const savedPhone = localStorage.getItem('customerPhone');
    const savedName = localStorage.getItem('customerName');
    if (savedPhone) setCustomerPhone(savedPhone);
    if (savedName) setCustomerName(savedName);
  }, []);

  const fetchData = async () => {
    try {
      const [productRes, categoryRes, toppingRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        toppingService.getAll(), // Trả về đúng hàm cũ của bạn
      ]);

      setProducts(productRes || []);
      setCategories(categoryRes || []);
      setToppings(toppingRes || []);
    } catch (error) {
      console.error(error);
      toast.error('Không tải được dữ liệu menu');
    }
  };

  // Tự động tìm kiếm khách hàng khi đủ 10 số
  useEffect(() => {
    if (customerPhone.trim().length === 10) {
      handleSearchCustomer(customerPhone.trim());
    } else {
      setFoundCustomer(null);
      setIsNewCustomer(false);
    }
  }, [customerPhone]);

  const handleSearchCustomer = async (phone: string) => {
    setIsSearchingCustomer(true);
    try {
      const customer = await customerService.searchByPhone(phone);
      if (customer) {
        setFoundCustomer(customer);
        setCustomerName(customer.name);
        setIsNewCustomer(false);
        toast.success(`Chào quay trở lại, ${customer.name}!`);
      } else {
        setFoundCustomer(null);
        setIsNewCustomer(true);
        toast.info('Số điện thoại mới! Vui lòng nhập họ tên để đăng ký tích điểm.');
      }
    } catch (error) {
      console.error("Lỗi tìm kiếm khách hàng:", error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // FILTER PRODUCTS
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return selectedCategory === 'all' || product.categoryId.toString() === selectedCategory;
    });
  }, [products, selectedCategory]);

  // OPEN PRODUCT DIALOG
  const openProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[0] || null);
    setSelectedToppings([]);
  };

  // TOGGLE TOPPING
  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      }
      return [...prev, topping];
    });
  };

  // ADD TO CART
  const addToCart = () => {
    if (!selectedProduct) return;

    const toppingPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    const base = selectedProduct.basePrice || selectedProduct.price || 0;
    const extra = selectedSize?.extraPrice || 0;
    const singleItemPrice = base + extra + toppingPrice;

    const item: CartItem = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: 1,
      image: selectedProduct.image,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.sizeName,
      toppings: selectedToppings.map((t) => t.name),
      price: singleItemPrice,
    };

    setCart((prev) => [...prev, item]);
    toast.success(`Đã thêm ${selectedProduct.name} vào giỏ`);
    setSelectedProduct(null);
  };

  // UPDATE QUANTIFICATION
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // REMOVE FROM CART
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.info('Đã xóa món khỏi giỏ hàng');
  };

  // CALCULATE TOTALS
  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // SUBMIT ORDER
  const submitOrder = async () => {
    if (cart.length === 0) {
      return toast.error('Giỏ hàng của bạn đang trống');
    }

    if (customerPhone.trim() && !customerName.trim()) {
      return toast.error('Vui lòng điền Họ tên để hệ thống tích điểm');
    }

    try {
      setIsSubmitting(true);
      let finalCustomerId = null;

      if (customerPhone.trim() && customerName.trim()) {
        if (foundCustomer) {
          finalCustomerId = foundCustomer.id;
        } else if (isNewCustomer) {
          const newCustomer = await customerService.createCustomer({
            name: customerName.trim(),
            phone: customerPhone.trim()
          });
          finalCustomerId = newCustomer.id;
        }
        
        localStorage.setItem('customerId', String(finalCustomerId));
        localStorage.setItem('customerPhone', customerPhone.trim());
        localStorage.setItem('customerName', customerName.trim());
      } else {
        finalCustomerId = Number(localStorage.getItem('customerId')) || 1;
      }

      const payload = {
        tableId: Number(tableId),
        customerId: finalCustomerId, 
        orderType: 'DineIn',
        paymentStatus: paymentPreference === 'PAY_LATER' ? 'PayLater' : 'PendingPayment',
        paymentMethod: paymentPreference === 'VNPAY' ? 'VNPAY' : paymentPreference === 'CASH' ? 'CASH' : 'NONE',
        items: cart.map((item) => ({
          productId: item.productId,
          sizeId: item.sizeId || null,
          quantity: item.quantity,
          toppings: item.toppings.join(', '),
        })),
      };

      const orderResponse = await orderService.createOrder(payload);
      const createdOrder = orderResponse?.data; 
      const orderId = createdOrder?.id || createdOrder; 

      if (paymentPreference === 'CASH') {
        if (orderId) {
          await paymentService.cashPayment(orderId);
          toast.success('Yêu cầu thanh toán tiền mặt tại quầy đã được gửi!');
        }
      } else if (paymentPreference === 'VNPAY') {
        if (orderId) {
          const paymentRes = await paymentService.createVnpay(orderId);
          if (paymentRes?.data) {
            toast.info('Đang chuyển hướng sang cổng VNPay...');
            window.open(paymentRes.data, '_self'); 
          }
        }
      } else {
        toast.success('Đơn hàng đã được gửi thành công xuống bếp!');
      }

      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error(error);
      toast.error('Gửi đơn hoặc xử lý thanh toán thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-32 font-sans antialiased text-slate-900">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white px-4 py-7 shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md shadow-blue-600/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Snack Menu
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Gọi món tại bàn nhanh chóng
              </p>
            </div>
          </div>
          <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 text-center min-w-[90px]">
            <span className="text-[10px] font-bold block text-slate-400 uppercase tracking-wider">Vị trí</span>
            <span className="text-base font-black text-blue-400">BÀN {tableId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[73px] z-40 shadow-sm overflow-hidden">
        <div className="max-w-2xl mx-auto flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none snap-x">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className={`rounded-xl font-semibold shrink-0 snap-start px-4 transition-all duration-200 h-9 ${
              selectedCategory === 'all' 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' 
                : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            Tất cả
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
              className={`rounded-xl font-semibold shrink-0 snap-start px-4 transition-all duration-200 h-9 ${
                selectedCategory === category.id.toString()
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => setSelectedCategory(category.id.toString())}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* PRODUCTS CONTAINER */}
      <div className="max-w-2xl mx-auto p-4 space-y-3.5">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3 bg-white border border-dashed border-slate-200 rounded-2xl p-6">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <Layers className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium">Hiện chưa có món ăn nào thuộc danh mục này</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border border-slate-200/70 hover:border-slate-300 bg-white active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl"
              onClick={() => openProductDialog(product)}
            >
              <div className="flex p-3.5 gap-4">
                <div className="w-24 h-24 sm:w-26 sm:h-26 shrink-0 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                  <img
                    src={product.image || 'https://placehold.co/150'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-medium">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-black text-blue-600">
                      {(product.basePrice || product.price || 0).toLocaleString()}₫
                    </span>
                    <Button size="sm" className="rounded-xl h-8 px-3 font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none">
                      <Plus className="w-4 h-4 mr-1 stroke-[2.5]" /> Thêm
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 🛒 FLOAT CART BAR CONTROL - ĐÃ CHUYỂN SANG TRÁI (left-6) TRÁNH ĐÈ AI CHATBOX */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-20 left-6 z-40 animate-in fade-in zoom-in-95 duration-300">
          <Button
            onClick={() => setShowCart(true)}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center relative p-0 border border-blue-500 active:scale-95 transition-all duration-200"
          >
            <ShoppingCart className="w-6 h-6 text-white" />

            <Badge className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white border-2 border-white px-1.5 h-5 min-w-[20px] flex items-center justify-center rounded-full font-black text-[10px] shadow-sm">
              {totalItemsCount}
            </Badge>

            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950 text-[10px] font-black text-white px-2 py-0.5 rounded-md border border-slate-800 shadow-sm">
              {totalAmount.toLocaleString()}₫
            </span>
          </Button>
        </div>
      )}

      {/* DIALOG CHỌN SIZE & TOPPING */}
      <Dialog open={selectedProduct !== null} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none gap-0">
          {selectedProduct && (
            <>
              <div className="relative h-56 bg-slate-100">
                <img
                  src={selectedProduct.image || 'https://placehold.co/400x300'}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
                <div>
                  <DialogTitle className="text-xl font-black text-slate-800">{selectedProduct.name}</DialogTitle>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{selectedProduct.description}</p>
                </div>

                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Chọn Kích Cỡ (Size)</h4>
                    <RadioGroup
                      value={selectedSize?.id.toString()}
                      onValueChange={(val) =>
                        setSelectedSize(selectedProduct.sizes?.find((s) => s.id.toString() === val) || null)
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      {selectedProduct.sizes.map((size) => (
                        <div key={size.id} className="flex items-center">
                          <RadioGroupItem value={size.id.toString()} id={`size-${size.id}`} className="sr-only" />
                          <Label
                            htmlFor={`size-${size.id}`}
                            className={`flex justify-between items-center w-full px-4 py-3 border rounded-xl cursor-pointer font-bold transition-all duration-200 text-sm ${
                              selectedSize?.id === size.id
                                ? 'border-blue-500 bg-blue-50/50 text-blue-600'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{size.sizeName}</span>
                            <span className="text-xs font-black opacity-80">+{size.extraPrice.toLocaleString()}₫</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {toppings.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Thêm Topping</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {toppings.map((topping) => {
                        const isChecked = selectedToppings.some((t) => t.id === topping.id);
                        return (
                          <div
                            key={topping.id}
                            onClick={() => toggleTopping(topping)}
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer select-none transition-all duration-200 ${
                              isChecked ? 'border-blue-500 bg-blue-50/40' : 'border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox checked={isChecked} onCheckedChange={() => {}} className="rounded-md" />
                              <span className="text-sm font-bold text-slate-700">{topping.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-500">+{topping.price.toLocaleString()}₫</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tạm tính</span>
                  <span className="text-xl font-black text-blue-600">
                    {(
                      (selectedProduct.basePrice || selectedProduct.price || 0) +
                      (selectedSize?.extraPrice || 0) +
                      selectedToppings.reduce((sum, t) => sum + t.price, 0)
                    ).toLocaleString()}₫
                  </span>
                </div>
                <Button onClick={addToCart} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold px-6">
                  Thêm vào giỏ
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG CHI TIẾT GIỎ HÀNG */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none gap-0">
          <DialogHeader className="p-5 border-b bg-white">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" /> Món đã chọn ({totalItemsCount})
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 overflow-y-auto max-h-[45vh] space-y-4 scrollbar-thin">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                <img src={item.image || 'https://placehold.co/80'} className="w-16 h-16 object-cover rounded-xl border" />
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="font-bold text-sm text-slate-800 truncate">{item.productName}</h4>
                  {item.sizeName && <span className="text-[11px] font-medium text-slate-400 block mt-0.5">Size: {item.sizeName}</span>}
                  {item.toppings.length > 0 && (
                    <span className="text-[11px] italic text-slate-400 block truncate mt-0.5">+ {item.toppings.join(', ')}</span>
                  )}
                  <span className="text-sm font-black text-blue-600 block mt-1">{(item.price * item.quantity).toLocaleString()}₫</span>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-500 hover:bg-slate-50 rounded"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-black text-slate-800 px-1">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-500 hover:bg-slate-50 rounded"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}

            <Separator className="my-2" />

            {/* THÔNG TIN KHÁCH HÀNG TÍCH ĐIỂM */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-blue-500" /> Thông tin thành viên tích điểm
              </h4>
              
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="phone-input" className="text-xs font-bold text-slate-600">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="phone-input"
                      type="tel"
                      placeholder="Nhập số điện thoại để tích điểm..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3 top-3 h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name-input" className="text-xs font-bold text-slate-600">Tên khách hàng</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="name-input"
                      type="text"
                      placeholder="Nhập tên của bạn..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={foundCustomer !== null} 
                      className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal
                        ${foundCustomer ? 'bg-slate-100/80 cursor-not-allowed border-emerald-200 text-emerald-700' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                </div>

                {foundCustomer && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs text-emerald-800 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-black">Thành viên thân thiết</p>
                      <p className="text-[11px] text-emerald-600 font-medium">Số điểm tích lũy hiện có: <span className="font-black text-sm text-emerald-700">{foundCustomer.points}</span> điểm</p>
                    </div>
                  </div>
                )}
                
                {isNewCustomer && customerName.trim() && (
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-800 font-medium animate-in fade-in">
                    ✨ Hệ thống sẽ tự động đăng ký thành viên mới và tích điểm cho bạn sau khi đơn hàng hoàn tất!
                  </div>
                )}
              </div>
            </div>

            {/* THANH TOÁN */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Hình thức thanh toán</h4>
              <RadioGroup value={paymentPreference} onValueChange={setPaymentPreference} className="grid grid-cols-1 gap-2">
                
                <div
                  onClick={() => setPaymentPreference('PAY_LATER')}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                    paymentPreference === 'PAY_LATER' ? 'border-blue-500 bg-blue-50/40 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-bold">Thành toán sau</p>
                      <p className="text-[11px] text-slate-400 font-medium">Nhà bếp chuẩn bị món ngay, thanh toán khi về</p>
                    </div>
                  </div>
                  <RadioGroupItem value="PAY_LATER" className="sr-only" />
                </div>

                <div
                  onClick={() => setPaymentPreference('VNPAY')}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                    paymentPreference === 'VNPAY' ? 'border-blue-500 bg-blue-50/40 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-bold">Cổng Thẻ/Ví VNPay</p>
                      <p className="text-[11px] text-slate-400 font-medium">Thanh toán trực tuyến an toàn, nhanh chóng</p>
                    </div>
                  </div>
                  <RadioGroupItem value="VNPAY" className="sr-only" />
                </div>

                <div
                  onClick={() => setPaymentPreference('CASH')}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                    paymentPreference === 'CASH' ? 'border-blue-500 bg-blue-50/40 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold">Tiền mặt tại quầy</p>
                      <p className="text-[11px] text-slate-400 font-medium">Gửi yêu cầu thanh toán bằng tiền mặt lên hệ thống</p>
                    </div>
                  </div>
                  <RadioGroupItem value="CASH" className="sr-only" />
                </div>

              </RadioGroup>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-bold">Tổng số tiền cần trả:</span>
              <span className="text-2xl font-black text-blue-600">{totalAmount.toLocaleString()}₫</span>
            </div>
            <Button
              onClick={submitOrder}
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Đang xử lý đơn...' : paymentPreference === 'PAY_LATER' ? 'Gửi đơn xuống bếp' : 'Thanh toán & Gửi đơn'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}