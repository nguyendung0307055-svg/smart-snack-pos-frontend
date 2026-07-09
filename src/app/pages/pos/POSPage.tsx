import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  LogOut,
  Bell,
  Clock as ClockIcon,
  Check,
  ReceiptText,
  User,
  Award,
  UserMinus,
  CheckCircle,
  LogIn,
  Printer
} from 'lucide-react';

// Import Services & Data
import { toast } from 'sonner';
import { notificationSound } from '../../utils/notificationSound';
import { format, differenceInMinutes } from 'date-fns';
import categoryService from '../../../services/categoryService';
import productService from '../../../services/productService';
import toppingService from '../../../services/toppingService';
import orderService from '../../../services/orderService';
import paymentService from '../../../services/paymentService';
import tableService from '../../../services/tableService';
import customerService, { Customer } from '../../../services/customerService';

import axios from 'axios';
import scheduleService from '../../../services/scheduleService';

interface Topping {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface ProductSize {
  id: number;
  sizeName: string;
  extraPrice: number;
}

interface CartItem {
  id: string;
  productId: number;
  name: string;
  productName: string;
  quantity: number;
  basePrice?: number;
  price?: number;
  sizePrice: number;
  toppingPrice: number;
  totalPrice: number;
  selectedSize?: ProductSize;
  selectedToppings: Topping[];
  image?: string;
}

interface BackendTable {
  id: number;
  tableNumber: number;
  status: string;
  qrCodeUrl?: string;
}

export function POSPage() {
  const navigate = useNavigate();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // States dữ liệu
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [allToppings, setAllToppings] = useState<Topping[]>([]);
  const [dbTables, setDbTables] = useState<BackendTable[]>([]);
  const [loading, setLoading] = useState(true);

  // States UI
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | undefined>();
  const [orderNote, setOrderNote] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // STATES CHẤM CÔNG (ATTENDANCE)
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [showConfirmCheckOut, setShowConfirmCheckOut] = useState(false);

  // State cho Modal tùy chọn sản phẩm
  const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [isTakeAway, setIsTakeAway] = useState(false);
  const [showConfirmTakeAway, setShowConfirmTakeAway] = useState(false);

  // STATES QUẢN LÝ TÍCH ĐIỂM KHÁCH HÀNG & TẠO MỚI NHANH
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // State phục vụ modal đăng ký thành viên mới
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // NEW STATES: XUẤT HÓA ĐƠN (RECEIPT PRINTING)
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<{
    orderNumber: string;
    tableName: string;
    items: CartItem[];
    subtotal: number;
    pointsAdded: number;
    customerName?: string;
    paymentMethod: string;
    cashier: string;
    date: string;
  } | null>(null);

  // Quy đổi điểm: Cứ mỗi 10.000đ hóa đơn tích lũy được 1 điểm
  const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
  const estimatedPoints = Math.floor(subtotal / 10000);

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, prods, tops, tablesRes] = await Promise.all([
          categoryService.getAll(),
          productService.getAll(),
          toppingService.getAll(),
          tableService.getAll()
        ]);
        setDbCategories(cats || []);
        setDbProducts(prods || []);
        setAllToppings(tops || []);

        const tablesData = tablesRes?.data ? tablesRes.data : tablesRes;
        setDbTables(tablesData || []);

        try {
          const scheduleRes = await (scheduleService as any).getMyScheduleToday();
          const scheduleData = scheduleRes?.data ? scheduleRes.data : scheduleRes;
          if (scheduleData) {
            setTodaySchedule(scheduleData);

            if (scheduleData.attendance?.checkIn) {
              setIsCheckedIn(true);
              setShiftStartTime(new Date(scheduleData.attendance.checkIn));
            }
            if (scheduleData.attendance?.checkOut) {
              setIsCheckedOut(true);
            }
          }
        } catch (err) {
          console.log("Hôm nay nhân viên không có lịch trực hoặc chưa được xếp ca.");
        }

      } catch (error) {
        toast.error("Không thể kết nối đến máy chủ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Lỗi parse thông tin user từ localStorage", e);
      }
    } else {
      toast.error("Vui lòng đăng nhập hệ thống!");
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // HÀM XỬ LÝ CHECK-IN
  const handleCheckInClick = async () => {
    if (!todaySchedule) {
      return toast.error("Hệ thống không tìm thấy lịch trực hôm nay của bạn!");
    }
    try {
      await (scheduleService as any).checkIn(todaySchedule.id);
      notificationSound.playBell();
      setShiftStartTime(new Date());
      setIsCheckedIn(true);
      toast.success("Điểm danh vào ca (Check In) thành công!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check In thất bại hoặc đã quá hạn!");
    }
  };

  // HÀM XỬ LÝ CHECK-OUT REAL-TIME
  const handleCheckOutConfirm = async () => {
    if (!todaySchedule) return;
    try {
      await (scheduleService as any).checkOut(todaySchedule.id);
      setIsCheckedOut(true);
      toast.success("Điểm danh ra ca (Check Out) thành công!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check Out thất bại!");
    } finally {
      setShowConfirmCheckOut(false);
    }
  };

  // HÀM XỬ LÝ TÌM KIẾM KHÁCH HÀNG QUA SĐT
  const handleSearchCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    try {
      setIsSearching(true);
      setSearchError('');
      const response = await customerService.searchByPhone(searchPhone.trim());
      const customerData = response?.data ? response.data : response;

      if (!customerData || !customerData.id) {
        setSearchError('Số điện thoại này chưa đăng ký thành viên!');
        setSelectedCustomer(null);
        return;
      }

      setSelectedCustomer(customerData);
      toast.success(`Đã gắn khách hàng: ${customerData.name}`);
    } catch (err: any) {
      setSearchError('Số điện thoại này chưa đăng ký thành viên!');
      setSelectedCustomer(null);
    } finally {
      setIsSearching(false);
    }
  };

  // HÀM TẠO NHANH THÀNH VIÊN MỚI
  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      return toast.error("Vui lòng nhập tên khách hàng");
    }
    try {
      setIsCreatingCustomer(true);
      let newCustomerData: Customer;
      if (typeof (customerService as any).create === 'function') {
        newCustomerData = await (customerService as any).create({
          name: newCustomerName.trim(),
          phone: searchPhone.trim()
        });
      } else {
        const res = await axios.post(
          "http://10.68.174.38:8080/api/customers",
          { name: newCustomerName.trim(), phone: searchPhone.trim() },
          { withCredentials: true }
        );
        newCustomerData = res.data;
      }

      setSelectedCustomer(newCustomerData);
      setShowCreateCustomerModal(false);
      setNewCustomerName('');
      setSearchError('');
      toast.success(`Đăng ký & gắn thành công thành viên: ${newCustomerData.name}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể tạo thành viên mới");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Logic lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return dbProducts.filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const rawCatId = product.categoryId;
      const catIdStr = rawCatId ? rawCatId.toString() : "";
      return matchesSearch && (selectedCategory === 'all' || catIdStr === selectedCategory);
    });
  }, [dbProducts, searchTerm, selectedCategory]);

  // Xử lý thêm vào giỏ hàng
  const handleConfirmAdd = () => {
    if (!customizingProduct) return;

    const toppingIds = selectedToppings.map(t => t.id).sort().join(',');
    const configId = `${customizingProduct.id}-${selectedSize?.id || 'default'}-${toppingIds}`;

    const existingItem = cart.find(item => item.id === configId);
    const sizeExtra = selectedSize?.extraPrice || 0;
    const toppingExtra = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const basePrice = customizingProduct.basePrice || customizingProduct.price || 0;

    if (existingItem) {
      updateQuantity(existingItem.id, 1);
    } else {
      const newItem: CartItem = {
        id: configId,
        productId: customizingProduct.id,
        name: customizingProduct.name,
        productName: customizingProduct.name,
        quantity: 1,
        basePrice: basePrice,
        sizePrice: sizeExtra,
        toppingPrice: toppingExtra,
        totalPrice: basePrice + sizeExtra + toppingExtra,
        selectedSize: selectedSize || undefined,
        selectedToppings: [...selectedToppings],
        image: customizingProduct.image
      };
      setCart([...cart, newItem]);
    }

    setCustomizingProduct(null);
    setSelectedSize(null);
    setSelectedToppings([]);
    toast.success(`Đã thêm ${customizingProduct.name}`);
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev =>
      prev.find(t => t.id === topping.id)
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev
      .map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // XỬ LÝ THANH TOÁN VÀ LƯU THÔNG TIN XUẤT BILL
  const handlePayment = async (method: 'cash' | 'vnpay') => {
    try {
      if (!currentOrderId) {
        return toast.error('Vui lòng báo bếp trước khi thực hiện thanh toán');
      }

      // Xác định tên bàn hiển thị trên bill
      let currentTableName = "Mang về";
      if (!isTakeAway && selectedTable) {
        const tObj = dbTables.find(t => t.id === selectedTable);
        if (tObj) currentTableName = `Bàn ${tObj.tableNumber}`;
      }

      // Lưu trữ thông tin phục vụ xuất hóa đơn trước khi clear giỏ hàng
      const receiptPayload = {
        orderNumber: `ORD-${currentOrderId}`,
        tableName: currentTableName,
        items: [...cart],
        subtotal: subtotal,
        pointsAdded: selectedCustomer ? estimatedPoints : 0,
        customerName: selectedCustomer ? selectedCustomer.name : undefined,
        paymentMethod: method === 'cash' ? 'Tiền mặt' : 'VNPay QR',
        cashier: currentUser?.username || 'Nhân viên',
        date: format(new Date(), 'dd/MM/yyyy HH:mm'),
      };

      if (method === 'cash') {
        await paymentService.cashPayment(currentOrderId);
        notificationSound.playDoubleBell();
        toast.success('Thanh toán tiền mặt thành công!');
        
        // Hiện Modal Bill trực tiếp cho Tiền mặt
        setCompletedOrderData(receiptPayload);
        setShowReceipt(true);
      }

      if (method === 'vnpay') {
        const response = await paymentService.createVnpay(currentOrderId);
        window.open(response.data, '_blank');
        toast.success('Đang khởi tạo cổng thanh toán VNPay QR');
        
        // Hiện Modal Bill cho VNPay
        setCompletedOrderData(receiptPayload);
        setShowReceipt(true);
      }

      // Reset Form trạng thái bán hàng
      setCart([]);
      setShowPayment(false);
      setSelectedTable(undefined);
      setIsTakeAway(false);
      setCurrentOrderId(null);
      setSelectedCustomer(null);
      setSearchPhone('');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Thanh toán thất bại');
    }
  };

  // KÍCH HOẠT LỆNH IN RA MÁY IN NHIỆT
  const handlePrintReceipt = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      // Trả lại binding sự kiện và trạng thái React sau khi phá hủy DOM để in
      window.location.reload();
    }
  };

  const sendToKitchen = async () => {
    if (cart.length === 0) {
      return toast.error('Chưa có món trong đơn hàng');
    }

    if (isTakeAway) {
      setShowConfirmTakeAway(true);
    } else {
      executeSendToKitchen();
    }
  };

  const executeSendToKitchen = async () => {
    try {
      const payload = {
        tableId: !isTakeAway && selectedTable ? Number(selectedTable) : null,
        orderType: isTakeAway ? 'TakeAway' : 'DineIn',
        note: orderNote,
        customerId: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((item) => ({
          productId: item.productId,
          sizeId: item.selectedSize?.id || null,
          quantity: item.quantity,
          toppings: item.selectedToppings.map((t) => t.name).join(', '),
        })),
      };

      const response = await orderService.createOrder(payload);
      notificationSound.playBell();
      toast.success(`Đã gửi đơn ${response.data.orderNumber} xuống bếp`);
      setCurrentOrderId(response.data.id);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Gửi đơn hàng thất bại');
    } finally {
      setShowConfirmTakeAway(false);
    }
  };

  const workTime = shiftStartTime ? differenceInMinutes(currentTime, shiftStartTime) : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      {/* OPTION DIALOG (SIZE & TOPPING) */}
      <Dialog open={!!customizingProduct} onOpenChange={() => setCustomizingProduct(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden">
          <div className="relative h-48 bg-gray-200">
            <img
              src={customizingProduct?.image || 'https://via.placeholder.com/500'}
              className="w-full h-full object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <h2 className="text-white text-3xl font-black">{customizingProduct?.name}</h2>
            </div>
          </div>

          <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Chọn Size */}
            {customizingProduct?.sizes?.length > 0 && (
              <div>
                <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                  <Badge className="bg-blue-600 rounded-lg">1</Badge> CHỌN KÍCH CỠ
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {customizingProduct.sizes.map((size: ProductSize) => (
                    <Button
                      key={size.id}
                      variant={selectedSize?.id === size.id ? "default" : "outline"}
                      className={`h-16 rounded-2xl flex flex-col transition-all ${selectedSize?.id === size.id ? 'bg-blue-600 border-blue-600 scale-105' : 'hover:border-blue-500'}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <span className="font-bold">{size.sizeName}</span>
                      <span className="text-[10px] opacity-80">+{size.extraPrice.toLocaleString()}₫</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chọn Topping */}
            <div>
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <Badge className="bg-blue-600 rounded-lg">2</Badge> THÊM TOPPING
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {allToppings.map((topping) => {
                  const isSelected = selectedToppings.find(t => t.id === topping.id);
                  return (
                    <div
                      key={topping.id}
                      onClick={() => toggleTopping(topping)}
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                    >
                      <img src={topping.image || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <p className="font-bold text-xs text-gray-800">{topping.name}</p>
                        <p className="text-blue-600 text-[11px] font-black">+{topping.price.toLocaleString()}₫</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-[-8px] right-[-8px] bg-blue-600 text-white rounded-full p-1 shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t">
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-bold rounded-2xl shadow-xl shadow-blue-100" onClick={handleConfirmAdd}>
              Thêm vào giỏ • {((customizingProduct?.basePrice || customizingProduct?.price || 0) + (selectedSize?.extraPrice || 0) + selectedToppings.reduce((s, t) => s + t.price, 0)).toLocaleString()}₫
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">🍟</div>
          <div>
            <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">Smart Snack POS</h1>
            <div className="flex items-center gap-2 text-xs text-green-600 font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              {currentUser?.username || 'Nhân viên'} ({currentUser?.role || 'STAFF'}) • Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={handleCheckInClick}
            disabled={isCheckedIn || !todaySchedule}
            className={`font-bold transition-all rounded-xl shadow-md ${isCheckedIn ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            {isCheckedIn ? "Đã Check In" : "Check In Ca"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowConfirmCheckOut(true)}
            disabled={!isCheckedIn || isCheckedOut}
            className={`font-bold transition-all rounded-xl shadow-md ${(!isCheckedIn || isCheckedOut) ? 'bg-gray-100 text-gray-400' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {isCheckedOut ? "Đã Kết Ca" : "Check Out Ca"}
          </Button>

          {shiftStartTime && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">{Math.floor(workTime / 60)}h {workTime % 60}m</span>
            </div>
          )}

          <Button variant="outline" size="sm" className="font-bold rounded-xl" onClick={() => navigate('/orders')}>
            <ReceiptText className="w-4 h-4 mr-2" />
            Xem đơn
          </Button>

          <Button variant="outline" size="sm" className="font-bold rounded-xl" onClick={() => navigate('/admin/tables')}>
            🧹 Quản lý bàn
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-bold text-red-500 hover:bg-red-50 rounded-xl"
            onClick={() => {
              localStorage.removeItem('user');
              toast.success("Đã đăng xuất thành công");
              navigate('/');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Thoát
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product List */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="relative mb-6 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm tên món ăn nhanh..."
              className="pl-12 bg-white border-none shadow-sm h-14 text-lg rounded-2xl focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="flex gap-4 mb-6 overflow-x-auto pb-4 shrink-0 scrollbar-hide">
            <div
              onClick={() => setSelectedCategory('all')}
              className={`flex flex-col items-center min-w-[90px] cursor-pointer transition-all ${selectedCategory === 'all' ? 'scale-105' : 'opacity-70'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-md border-2 ${selectedCategory === 'all' ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-gray-500'}`}>
                <span className="text-2xl font-bold">ALL</span>
              </div>
              <span className={`text-[11px] font-black uppercase ${selectedCategory === 'all' ? 'text-blue-600' : 'text-gray-500'}`}>Tất cả</span>
            </div>

            {dbCategories.map((cat) => (
              <div key={cat.id} onClick={() => setSelectedCategory(cat.id.toString())} className={`flex flex-col items-center min-w-[90px] cursor-pointer transition-all ${selectedCategory === cat.id.toString() ? 'scale-105' : 'opacity-70'}`}>
                <div className={`w-16 h-16 rounded-2xl overflow-hidden mb-2 shadow-md border-2 ${selectedCategory === cat.id.toString() ? 'border-blue-600' : 'border-transparent'}`}>
                  <img src={cat.image || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[11px] font-black uppercase text-center line-clamp-1 ${selectedCategory === cat.id.toString() ? 'text-blue-600' : 'text-gray-500'}`}>{cat.name}</span>
              </div>
            ))}
          </div>

          {/* Grid Products */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p>Đang tải menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group border-none shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden rounded-2xl" onClick={() => setCustomizingProduct(product)}>
                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                      <img src={product.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-2 h-10 leading-tight">{product.name}</h3>
                      <p className="text-blue-600 font-black text-lg">{(product.basePrice || product.price || 0).toLocaleString()}₫</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Shopping Cart */}
        <div className="w-[420px] bg-white border-l shadow-2xl flex flex-col shrink-0">
          <CardHeader className="py-5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-blue-600" /> Đơn hàng</CardTitle>
              <Badge className="bg-blue-600 text-lg px-3 py-1 rounded-full font-bold">{cart.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <Select
                value={isTakeAway ? 'takeaway' : String(selectedTable ?? '')}
                onValueChange={(value) => {
                  if (value === 'takeaway') {
                    setIsTakeAway(true);
                    setSelectedTable(undefined);
                    return;
                  }
                  const tableId = parseInt(value);
                  setSelectedTable(tableId);
                  setIsTakeAway(false);
                }}
              >
                <SelectTrigger className="w-full bg-gray-50 border-none h-12 rounded-xl font-bold">
                  <SelectValue placeholder="Chọn vị trí phục vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="takeaway" className="font-bold text-orange-600">🥡 Mang về (Take away)</SelectItem>
                  {dbTables.map(table => (
                    <SelectItem
                      key={table.id}
                      value={table.id.toString()}
                      disabled={table.status === "OCCUPIED"}
                    >
                      {table.status === "AVAILABLE"
                        ? `🟢 Bàn ${table.tableNumber} (Trống)`
                        : `🔴 Bàn ${table.tableNumber} (Có khách)`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Ghi chú cho bếp..."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </CardHeader>

          {/* TÍCH ĐIỂM KHÁCH HÀNG */}
          <div className="px-4 pt-4 border-b pb-4 bg-slate-50/50 shrink-0 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-blue-600" /> Khách hàng & Tích điểm
            </div>

            {!selectedCustomer ? (
              <div className="space-y-2">
                <form onSubmit={handleSearchCustomer} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Nhập SĐT khách tích điểm..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="pl-9 h-10 bg-white rounded-xl text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-10 px-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl" disabled={isSearching}>
                    {isSearching ? '...' : 'Tìm'}
                  </Button>
                </form>

                {searchError && (
                  <div className="flex items-center justify-between bg-amber-50 p-2 rounded-xl border border-amber-100 mt-1 animate-in fade-in duration-200">
                    <span className="text-[11px] text-amber-700 font-semibold">{searchError}</span>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 bg-orange-500 hover:bg-orange-600 text-[11px] font-bold px-2.5 rounded-lg text-white shadow-sm shrink-0"
                      onClick={() => setShowCreateCustomerModal(true)}
                    >
                      + Đăng ký mới
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 p-3 rounded-2xl relative shadow-sm">
                <button
                  type="button"
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => { setSelectedCustomer(null); setSearchPhone(''); setSearchError(''); }}
                >
                  <UserMinus className="w-4 h-4" />
                </button>
                <div className="font-bold text-gray-800 text-sm truncate max-w-[85%]">{selectedCustomer.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">Số điện thoại: {selectedCustomer.phone}</div>
                <div className="mt-2 flex items-center justify-between bg-amber-50/60 border border-amber-100 rounded-xl p-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                    <Award className="w-4 h-4 text-amber-500" /> Điểm hiện có:
                  </span>
                  <span className="text-sm font-black text-amber-600">{selectedCustomer.points}đ</span>
                </div>
              </div>
            )}
          </div>

          {/* Giỏ hàng */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingCart className="w-20 h-20 mb-4" /><p className="font-bold uppercase tracking-widest">Trống</p></div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <img src={item.image || 'https://via.placeholder.com/60'} className="w-16 h-16 rounded-2xl object-cover shadow-inner" alt="" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm text-gray-800 leading-tight">{item.productName}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedSize && <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 border-none">{item.selectedSize.sizeName}</Badge>}
                        {item.selectedToppings.map(t => (
                          <Badge key={t.id} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-none">+{t.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-dashed">
                    <div className="flex items-center border rounded-xl bg-gray-50 p-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <span className="font-black text-blue-600">{(item.totalPrice * item.quantity).toLocaleString()}₫</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chân giỏ hàng */}
          <div className="p-5 bg-white border-t space-y-4 shadow-inner shrink-0">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase text-xs">Tổng cộng</span>
                <span className="font-black text-3xl text-blue-700">{subtotal.toLocaleString()}₫</span>
              </div>

              {selectedCustomer && estimatedPoints > 0 && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Điểm tích lũy thêm:
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600">+{estimatedPoints} điểm</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-2xl font-bold border-2" onClick={sendToKitchen} disabled={cart.length === 0}><Bell className="w-5 h-5 mr-2" /> Báo bếp</Button>
              <Button className="h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold shadow-lg shadow-blue-200" onClick={() => setShowPayment(true)} disabled={cart.length === 0}><CreditCard className="w-5 h-5 mr-2" /> Thanh toán</Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ĐĂNG KÝ THÀNH VIÊN MỚI */}
      <Dialog open={showCreateCustomerModal} onOpenChange={setShowCreateCustomerModal}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Đăng ký thành viên mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-500">SỐ ĐIỆN THOẠI</Label>
              <Input value={searchPhone} disabled className="h-11 rounded-xl bg-gray-100 font-bold text-gray-700 border-none" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-600">HỌ VÀ TÊN KHÁCH HÀNG</Label>
              <Input
                placeholder="Nhập tên khách..."
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="h-11 rounded-xl focus-visible:ring-blue-500 font-medium"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowCreateCustomerModal(false)}>Hủy</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white px-5"
              onClick={handleCreateCustomer}
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? 'Đang đăng ký...' : 'Đăng ký & Tích điểm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL PHƯƠNG THỨC THANH TOÁN */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Phương thức thanh toán</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-8 rounded-3xl text-center border border-blue-100">
              <p className="text-blue-600 mb-1 font-bold uppercase text-xs">Số tiền cần thu</p>
              <h2 className="text-4xl font-black text-blue-700">{subtotal.toLocaleString()}₫</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-32 flex flex-col rounded-3xl border-2 hover:border-blue-500 gap-3" onClick={() => handlePayment('cash')}>
                <Banknote className="w-8 h-8 text-green-600" />
                <span className="font-bold">Tiền mặt</span>
              </Button>
              <Button variant="outline" className="h-32 flex flex-col rounded-3xl border-2 hover:border-blue-500 gap-3" onClick={() => handlePayment('vnpay')}>
                <QrCode className="w-8 h-8 text-blue-600" />
                <span className="font-bold">VNPay QR</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW MODAL: XEM TRƯỚC VÀ IN HÓA ĐƠN K80 */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-indigo-600" />
              Xem trước hóa đơn bán hàng
            </DialogTitle>
          </DialogHeader>

          {/* Khu vực chứa giao diện thiết kế Bill thanh toán */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">
            <div ref={printAreaRef} className="bg-white p-4 shadow-sm rounded-xl font-mono text-xs text-slate-800 space-y-4">
              
              {/* Cấu trúc In ấn CSS ẩn chuyên dụng */}
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  .print-window, .print-window * { visibility: visible; }
                  .print-window { position: absolute; left: 0; top: 0; width: 100%; font-size: 12px; }
                }
              `}</style>

              <div className="print-window space-y-4">
                {/* Header Bill */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black uppercase tracking-tight text-black">SMART SNACK SHOP</h3>
                  <p className="text-[10px] text-slate-500">Đ/C: Khu Công Nghệ Cao, Quận 9, TP. HCM</p>
                  <p className="text-[10px] text-slate-500">Hotline: 0909.123.456</p>
                  <div className="text-center font-bold text-black py-1 border-y border-dashed border-slate-300 my-2">
                    HÓA ĐƠN THANH TOÁN
                  </div>
                </div>

                {/* Metadata Đơn hàng */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span>Số HĐ:</span><span className="font-bold text-black">{completedOrderData?.orderNumber}</span></div>
                  <div className="flex justify-between"><span>Vị trí:</span><span className="font-bold text-black">{completedOrderData?.tableName}</span></div>
                  <div className="flex justify-between"><span>Thời gian:</span><span>{completedOrderData?.date}</span></div>
                  <div className="flex justify-between"><span>Thu ngân:</span><span>{completedOrderData?.cashier}</span></div>
                  {completedOrderData?.customerName && (
                    <div className="flex justify-between text-indigo-700 font-semibold">
                      <span>Thành viên:</span><span>{completedOrderData.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Danh sách sản phẩm mua */}
                <table className="w-full text-left text-[11px] border-t border-dashed border-slate-300 pt-2">
                  <thead>
                    <tr className="border-b border-slate-200 text-black font-bold">
                      <th className="pb-1 w-1/2">Tên món</th>
                      <th className="pb-1 text-center">SL</th>
                      <th className="pb-1 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrderData?.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top">
                        <td className="py-1.5">
                          <span className="font-bold text-slate-900">{item.productName}</span>
                          {item.selectedSize && <div className="text-[10px] text-slate-500">- Size: {item.selectedSize.sizeName}</div>}
                          {item.selectedToppings.length > 0 && (
                            <div className="text-[10px] text-slate-400 font-sans italic">
                              + Topping: {item.selectedToppings.map(t => t.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 text-center font-bold text-black">{item.quantity}</td>
                        <td className="py-1.5 text-right text-slate-900">{(item.totalPrice * item.quantity).toLocaleString()}₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tổng kết tài chính */}
                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between font-black text-black text-sm pt-1">
                    <span>TỔNG THÀNH TIỀN:</span>
                    <span>{completedOrderData?.subtotal.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hình thức:</span>
                    <span className="font-bold">{completedOrderData?.paymentMethod}</span>
                  </div>
                  {completedOrderData && completedOrderData.pointsAdded > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <span>Điểm tích lũy mới:</span>
                      <span>+{completedOrderData.pointsAdded} điểm</span>
                    </div>
                  )}
                </div>

                {/* Footer chân hóa đơn */}
                <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3 space-y-0.5">
                  <p className="italic font-sans">Cảm ơn Quý khách - Hẹn gặp lại!</p>
                  <p className="font-sans text-[9px]">Powered by Smart Snack System</p>
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowReceipt(false)}>
              Đóng lại
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2" onClick={handlePrintReceipt}>
              <Printer className="w-4 h-4" />
              In hóa đơn (Bill)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DIALOGS (ALERT DIALOG SHADCN UI) */}
      <AlertDialog open={showConfirmCheckOut} onOpenChange={setShowConfirmCheckOut}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận kết ca trực?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ thực hiện ghi nhận thời gian rời ca (Check Out) và kết toán toàn bộ dữ liệu chấm công của bạn hôm nay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckOutConfirm} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Xác nhận kết ca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmTakeAway} onOpenChange={setShowConfirmTakeAway}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đơn mang về?</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống sẽ chuyển lệnh làm món dạng mang đi (TakeAway) xuống phân hệ màn hình nhà bếp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeSendToKitchen} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              Xác nhận gửi bếp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}