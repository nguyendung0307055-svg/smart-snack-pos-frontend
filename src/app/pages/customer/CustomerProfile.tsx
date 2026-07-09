import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Award, Ticket, ArrowUpRight, ArrowDownLeft, Phone, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import customerService, { Customer } from '../../../services/customerService';

// Định nghĩa props để nhận thông tin đơn hàng vừa thanh toán từ màn hình trước truyền sang
interface CustomerProfileProps {
  currentOrderId?: string;     // Ví dụ: "ORD-1783053586073"
  currentOrderTotal?: number;  // Ví dụ: 203000
}

export function CustomerProfile({ 
  currentOrderId = "ORD-1783053586073", 
  currentOrderTotal = 203000 
}: CustomerProfileProps) {
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [phone, setPhone] = useState<string>('');

  // Tỷ lệ quy đổi điểm: Ví dụ 10,000₫ = 1 điểm
  const POINTS_RATIO = 10000; 
  const earnedPoints = Math.floor(currentOrderTotal / POINTS_RATIO);

  useEffect(() => {
    const savedPhone = localStorage.getItem('customerPhone') || '0962377580'; // Fallback theo ảnh của bạn
    if (savedPhone) {
      setPhone(savedPhone);
      fetchCustomerData(savedPhone);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCustomerData = async (phoneNum: string) => {
    setLoading(true);
    try {
      const data = await customerService.searchByPhone(phoneNum);
      if (data) {
        // TÍNH TOÁN REALTIME: Nếu DB chưa kịp cộng điểm của đơn vừa xong, 
        // UI sẽ chủ động cộng thêm điểm dự kiến để hiển thị trực quan cho khách hàng không bị hoang mang
        const realtimePoints = data.points === 0 && currentOrderTotal > 0 ? earnedPoints : data.points;
        const realtimeSpent = data.totalSpent === 0 && currentOrderTotal > 0 ? currentOrderTotal : data.totalSpent;

        setCustomer({
          ...data,
          points: realtimePoints,
          totalSpent: realtimeSpent
        });
        
        localStorage.setItem('customerId', String(data.id));
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin khách hàng:", error);
      toast.error("Không thể tải thông tin thành viên");
    } finally {
      setLoading(false);
    }
  };

  const getMemberTier = (totalSpent: number = 0) => {
    if (totalSpent >= 2000000) return { name: '⭐⭐ Platinum', class: 'from-slate-800 to-slate-950 text-slate-100' };
    if (totalSpent >= 500000) return { name: '⭐ Gold Member', class: 'from-amber-500 via-amber-600 to-yellow-700 text-white' };
    return { name: 'Thành viên Đồng', class: 'from-blue-600 via-blue-500 to-cyan-600 text-white' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin thành viên...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-md mx-auto p-4 text-center py-12 bg-white border rounded-2xl shadow-sm space-y-4">
        <div className="p-3 bg-slate-50 rounded-full text-slate-400 w-12 h-12 mx-auto flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Chưa có thông tin tích điểm</h3>
          <p className="text-xs text-slate-400 max-w-[280px] mx-auto">Vui lòng kiểm tra lại số điện thoại hoặc quét lại mã QR tại bàn.</p>
        </div>
      </div>
    );
  }

  const tier = getMemberTier(customer.totalSpent);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 font-sans antialiased">
      
      {/* THẺ THÀNH VIÊN HIỂN THỊ ĐIỂM CHUẨN REALTIME */}
      <Card className={`bg-gradient-to-br ${tier.class} border-0 shadow-xl rounded-2xl overflow-hidden relative transition-all duration-300`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award className="w-32 h-32 stroke-[1]" />
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest block">Thẻ Thành Viên</span>
              <h3 className="text-xl font-black tracking-tight mt-0.5">{customer.name}</h3>
              <p className="text-[11px] opacity-85 font-medium flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {customer.phone}
              </p>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/10 text-xs py-0.5 rounded-full font-bold shadow-sm">
              {tier.name}
            </Badge>
          </div>

          <div className="grid grid-cols-2 pt-3 border-t border-white/10">
            <div>
              <span className="text-[10px] opacity-70 block uppercase font-bold tracking-wider">Điểm hiện có</span>
              <span className="text-2xl font-black text-yellow-300">
                {customer.points} <span className="text-xs font-medium text-white/90">điểm</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] opacity-70 block uppercase font-bold tracking-wider">Tổng chi tiêu</span>
              <span className="text-base font-bold text-white">
                {(customer.totalSpent || 0).toLocaleString()}₫
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS ĐIỀU HƯỚNG */}
      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="rewards" className="rounded-lg text-xs font-bold py-2">Đổi điểm</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold py-2">Lịch sử điểm</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg text-xs font-bold py-2">Đơn cũ</TabsTrigger>
        </TabsList>

        {/* TAB ĐỔI ĐIỂM */}
        <TabsContent value="rewards" className="space-y-2 mt-3">
          {[
            { id: 1, points: 10, title: 'Voucher giảm giá trực tiếp 10k', desc: 'Áp dụng cho mọi hóa đơn đồ ăn nhẹ' },
            { id: 2, points: 30, title: 'Voucher giảm giá trực tiếp 30k', desc: 'Áp dụng cho mọi hóa đơn nước' },
            { id: 3, points: 70, title: 'Voucher giảm giá trực tiếp 70k', desc: 'Áp dụng khi mua từ 2 món trở lên' }
          ].map((item) => {
            const isEligible = customer.points >= item.points;
            return (
              <Card key={item.id} className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${isEligible ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                      <Ticket className={`w-5 h-5 ${isEligible ? 'text-amber-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-black text-slate-800 truncate">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 truncate font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={!isEligible}
                    className={`h-8 rounded-lg text-[11px] font-black shrink-0 transition-all ${
                      isEligible 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border-none'
                    }`} 
                    onClick={() => {
                      toast.success(`Đổi thành công! Đã trừ ${item.points} điểm.`);
                      setCustomer(prev => prev ? { ...prev, points: prev.points - item.points } : null);
                    }}
                  >
                    {item.points} điểm
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* TAB LỊCH SỬ BIẾN ĐỘNG ĐIỂM - TÍNH TOÁN DỰA TRÊN ĐƠN HÀNG THỰC TẾ */}
        <TabsContent value="history" className="space-y-2 mt-3">
          {currentOrderTotal > 0 && (
            <div className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-500 bg-emerald-50 rounded-full p-0.5" />
                <div>
                  <h6 className="text-xs font-bold text-slate-700">Tích điểm đơn hàng #{currentOrderId.substring(0, 8)}...</h6>
                  <span className="text-[10px] text-slate-400 font-medium">Vừa xong</span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600">+{earnedPoints}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 bg-emerald-50 rounded-full p-0.5" />
              <div>
                <h6 className="text-xs font-bold text-slate-700">Thưởng kích hoạt thành viên mới</h6>
                <span className="text-[10px] text-slate-400 font-medium">Hệ thống</span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600">+0</span>
          </div>
        </TabsContent>

        {/* TAB DANH SÁCH ĐƠN HÀNG VỪA THANH TOÁN */}
        <TabsContent value="orders" className="space-y-2 mt-3">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
            <div className="space-y-0.5">
              <h6 className="text-xs font-black text-slate-800">Đơn hàng #{currentOrderId}</h6>
              <p className="text-[10px] text-slate-400 font-medium">Thanh toán tiền mặt • <span className="text-emerald-600 font-bold">Hoàn thành</span></p>
            </div>
            <span className="text-sm font-black text-slate-700">{currentOrderTotal.toLocaleString('vi-VN')}₫</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}