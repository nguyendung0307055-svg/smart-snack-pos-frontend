import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Wallet, Banknote, CreditCard, ChevronDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerPayment() {
  const [method, setMethod] = useState<string>('VNPAY');
  
  // Các thông số tiền tệ cấu hình
  const subtotal = 250000;
  const voucherDiscount = 20000;
  const pointsDiscount = 10000;
  const promoDiscount = 10000;
  const finalTotal = subtotal - voucherDiscount - pointsDiscount - promoDiscount;

  const handlePayment = () => {
    toast.success(`Khởi tạo giao dịch qua ${method} thành công! Đang chuyển hướng...`);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-black text-slate-800">Thanh toán đơn hàng</h2>

      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
        <CardContent className="p-4 space-y-4">
          
          {/* Hạn mức tài chính */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tổng tiền món ăn</span>
              <span className="font-semibold text-slate-700">{subtotal.toLocaleString('vi-VN')}₫</span>
            </div>
            
            <div className="flex justify-between text-sm items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1">Mã Voucher <Badge variant="secondary" className="bg-red-50 text-red-600 text-[10px]">Đã áp dụng</Badge></span>
              <span className="font-semibold text-red-500">-{voucherDiscount.toLocaleString('vi-VN')}₫</span>
            </div>

            <div className="flex justify-between text-sm items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Điểm tích lũy</span>
              <span className="font-semibold text-purple-600">-{pointsDiscount.toLocaleString('vi-VN')}₫</span>
            </div>

            <div className="flex justify-between text-sm items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Khuyến mãi hệ thống</span>
              <span className="font-semibold text-amber-600">-{promoDiscount.toLocaleString('vi-VN')}₫</span>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-bold text-slate-800">Tổng tiền thanh toán</span>
              <span className="text-2xl font-black text-blue-600">{finalTotal.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>

          <Separator />

          {/* CHỌN CỔNG THANH TOÁN CHUẨN POS */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chọn phương thức thanh toán</Label>
            <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-1 gap-2">
              {[
                { id: 'CASH', name: 'Tiền mặt tại quầy', icon: <Banknote className="w-4 h-4 text-emerald-500" /> },
                { id: 'VNPAY', name: 'Ứng dụng ngân hàng VNPAY-QR', icon: <CreditCard className="w-4 h-4 text-blue-500" /> },
                { id: 'MOMO', name: 'Ví điện tử MoMo', icon: <Wallet className="w-4 h-4 text-pink-500" /> },
                { id: 'ZALOPAY', name: 'Ví điện tử ZaloPay', icon: <Wallet className="w-4 h-4 text-sky-500" /> }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setMethod(item.id)}
                  className={`flex items-center justify-between border rounded-xl p-3.5 cursor-pointer transition-all ${
                    method === item.id ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <Label htmlFor={item.id} className="font-bold text-slate-700 text-sm cursor-pointer">{item.name}</Label>
                  </div>
                  <RadioGroupItem value={item.id} id={item.id} />
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={handlePayment} className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
            Xác nhận thanh toán ngay
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}