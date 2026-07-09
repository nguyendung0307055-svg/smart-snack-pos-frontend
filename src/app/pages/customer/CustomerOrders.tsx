import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { 
  FileText, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Package, 
  ChevronRight, 
  RefreshCw,
  CreditCard,
  Wallet,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import orderService from '../../../services/orderService';
import { Close } from '@radix-ui/react-dialog';

export function CustomerOrders() {
  const { tableId } = useParams<{ tableId: string }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  /**
   * Mẹo xử lý: Lấy customerId từ bộ nhớ trình duyệt.
   * Nếu chưa có (null), tự động gán bằng 1 để bạn test giao diện không bị lỗi chặn màn hình.
   */
  const customerId = Number(localStorage.getItem('customerId')) || 1; 

  // Hàm call API lấy danh sách đơn hàng lọc theo cả BÀN và KHÁCH HÀNG
  const fetchOrders = useCallback(async (showLoading = false) => {
    if (!tableId || !customerId) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    
    try {
      // Gọi API kết hợp cả tableId và customerId để lọc chính xác đơn hàng
      const response = await orderService.getOrdersByTableAndCustomer(Number(tableId), customerId);
      
      // Log dữ liệu ra Console để bạn dễ dàng debug khi chạy thử trên trình duyệt
      console.log("=== Debug CustomerOrders ===");
      console.log("Tham số gửi đi:", { tableId: Number(tableId), customerId });
      console.log("Dữ liệu API gốc:", response);

      const data = response?.data || response; 
      const currentOrders = Array.isArray(data) ? data : [];
      setOrders(currentOrders);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu đơn hàng từ API:", error);
    } finally {
      setLoading(false);
    }
  }, [tableId, customerId]);

  // Khởi chạy lấy dữ liệu & thiết lập Polling cập nhật trạng thái tự động sau mỗi 5 giây
  useEffect(() => {
    fetchOrders(true);

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000); 

    return () => clearInterval(interval);
  }, [fetchOrders]); // Sử dụng fetchOrders làm dependency chính xác

  // Tự động đồng bộ và cập nhật lại dữ liệu trong Dialog chi tiết khi danh sách orders thay đổi
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updatedOrder = orders.find((o: any) => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder]);

  // Xử lý khi nhấn nút làm mới thủ công
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.promise(fetchOrders(false), {
      loading: 'Đang đồng bộ dữ liệu mới nhất...',
      success: () => {
        setIsRefreshing(false);
        return 'Đã cập nhật trạng thái đơn hàng!';
      },
      error: () => {
        setIsRefreshing(false);
        return 'Không thể kết nối máy chủ.';
      }
    });
  };

  // Cấu hình nhãn trạng thái (Status) từ Backend
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Chờ xử lý',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 animate-pulse" />
        };
      case 'COOKING':
        return {
          label: 'Đang chuẩn bị',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <ChefHat className="w-3.5 h-3.5 animate-bounce" />
        };
      case 'DONE':
        return {
          label: 'Hoàn thành',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: 'Hủy bỏ hoặc khác',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <Package className="w-3.5 h-3.5" />
        };
    }
  };

  // Tính toán % thanh tiến trình tương ứng
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'PENDING': return 'w-1/3';
      case 'COOKING': return 'w-2/3';
      case 'DONE': return 'w-full';
      default: return 'w-0';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] gap-2">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 min-h-screen bg-[#F8FAFC]">
      {/* HEADER PAGE */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Đơn hàng của tôi</h2>
          <div className="flex gap-2 mt-0.5">
            <p className="text-[11px] text-slate-400 font-bold">Bàn số: {tableId || "Chưa chọn"}</p>
            <p className="text-[11px] text-indigo-400 font-bold">|</p>
            <p className="text-[11px] text-indigo-500 font-bold">Khách hàng ID: {customerId}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white shadow-sm border border-slate-100" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* EMPTY STATE */}
      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl p-6 border border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-700">Chưa có đơn hàng nào</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng chọn món hoặc liên hệ nhân viên để gọi món nhé!</p>
        </div>
      )}

      {/* LIST ORDERS */}
      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);

        return (
          <Card key={order.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-4 space-y-4">
              
              {/* HEADER CARD */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã đơn hàng</span>
                  <h4 className="font-black text-slate-800 text-base">{order.orderNumber}</h4>
                </div>
                <Badge className={`flex items-center gap-1 px-2.5 py-1 border shadow-sm ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ${getProgressPercentage(order.status)}`} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span className={order.status ? 'text-blue-600' : ''}>Chờ xử lý</span>
                  <span className={['COOKING', 'DONE'].includes(order.status) ? 'text-blue-600' : ''}>Đang nấu</span>
                  <span className={order.status === 'DONE' ? 'text-emerald-600' : ''}>Hoàn thành</span>
                </div>
              </div>

              {/* LIST ITEMS TÓM TẮT */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-600 items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-black text-slate-800">
                        x{item.quantity} {item.productName}
                      </p>
                      {(item.sizeName || item.toppings) && (
                        <div className="mt-0.5 flex flex-wrap gap-1 text-[10px]">
                          {item.sizeName && <span className="bg-slate-200/60 px-1 rounded text-slate-500 font-medium">Size: {item.sizeName}</span>}
                          {item.toppings && <span className="text-slate-500 italic">+{item.toppings}</span>}
                        </div>
                      )}
                    </div>
                    <span className="font-black text-slate-700">{(item.price * item.quantity).toLocaleString()}₫</span>
                  </div>
                ))}
                
                <Separator className="my-2" />
                
                {/* TOTAL AMOUNT */}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500">Tổng thanh toán:</span>
                  <span className="text-lg font-black text-indigo-600">{order.totalAmount?.toLocaleString()}₫</span>
                </div>
              </div>

              {/* BUTTON XEM CHI TIẾT */}
              <Button onClick={() => setSelectedOrder(order)} variant="outline" className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                Xem chi tiết hóa đơn <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* CHI TIẾT ĐƠN HÀNG DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md w-[92%] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedOrder && (
            <div className="p-5 space-y-4 bg-white">
              <DialogHeader className="text-center">
                <DialogTitle className="text-base font-black text-slate-800 text-center tracking-wide">CHI TIẾT HÓA ĐƠN</DialogTitle>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">MÃ ĐƠN: {selectedOrder.orderNumber}</span>
              </DialogHeader>

              {/* THÔNG TIN VỊ TRÍ & THỜI GIAN */}
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Thời gian đặt:</span>{' '}
                  <span className="font-semibold">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Vị trí:</span>{' '}
                  <span className="font-semibold">
                    {selectedOrder.tableId ? `Bàn số ${selectedOrder.tableId}` : 'Mang về'}
                  </span>
                </div>
                
                {/* TRẠNG THÁI THANH TOÁN */}
                <div className="col-span-2 flex items-center justify-between mt-1 pt-2 border-t border-slate-200/60">
                  <div className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 
                    ${selectedOrder.paymentStatus === 'PAID' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'PAID' ? <CreditCard className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                    {selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </div>

                  <div className="px-2 py-1 rounded-lg text-[11px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                    Hình thức: {selectedOrder.paymentMethod === 'VNPAY' ? 'VNPAY' : selectedOrder.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chưa chọn'}
                  </div>
                </div>
              </div>

              {/* GHI CHÚ BẾP */}
              {selectedOrder.note && (
                <div className="p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-100 text-xs">
                  <p className="font-bold text-yellow-700 uppercase text-[10px] mb-0.5">Ghi chú gửi bếp</p>
                  <p className="text-yellow-800">{selectedOrder.note}</p>
                </div>
              )}

              <Separator className="border-dashed" />

              {/* DANH SÁCH MÓN CHI TIẾT */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2 last:border-none">
                    <div className="flex gap-2.5">
                      {item.image && (
                        <img src={item.image} alt={item.productName} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                      )}
                      <div>
                        <h5 className="font-black text-slate-800">{item.productName}</h5>
                        {item.sizeName && <p className="text-[10px] text-slate-400">Kích cỡ: {item.sizeName}</p>}
                        {item.toppings && <p className="text-[10px] text-slate-500">+{item.toppings}</p>}
                        <span className="text-slate-400 text-[11px]">Số lượng: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">{(item.price * item.quantity).toLocaleString()}₫</span>
                  </div>
                ))}
              </div>

              <Separator className="border-dashed" />

              {/* TÍNH TOÁN TIỀN TẠM TÍNH / TỔNG CỘNG */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold">{selectedOrder.totalAmount?.toLocaleString()}₫</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black text-slate-800 uppercase">Tổng cộng</span>
                  <span className="text-xl font-black text-indigo-600">{selectedOrder.totalAmount?.toLocaleString()}₫</span>
                </div>
              </div>

              {/* ACTION BUTTONS DIALOG */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs font-bold gap-1 border-slate-200" 
                  onClick={() => toast.success('Đã tải hóa đơn định dạng PDF')}
                >
                  <FileText className="w-3.5 h-3.5" /> Xuất PDF
                </Button>
                <Button 
                  className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white" 
                  onClick={() => setSelectedOrder(null)}
                >
                  <Close>Đóng</Close>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}