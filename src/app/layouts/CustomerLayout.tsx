import { useState } from 'react';
import { Utensils, Receipt, User } from 'lucide-react';
import { QRMenu } from '../pages/customer/QRMenu';
import { CustomerOrders } from '../pages/customer/CustomerOrders';
import { CustomerProfile } from '../pages/customer/CustomerProfile';
import { AIChatbox } from '../components/ui/AIChatbox';

export default function CustomerLayout() {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans antialiased relative">
      {/* Khung nội dung thay đổi theo Tab */}
      <div className="transition-all duration-200">
        {activeTab === 'menu' && <QRMenu />}
        {activeTab === 'orders' && <CustomerOrders />}
        {activeTab === 'profile' && <CustomerProfile />}
      </div>

      {/* 🌟 NÚT AI CHATBOX NỔI XUYÊN SUỐT TRÊN LAYOUT
          Được đẩy hẳn lên bottom-24 (cách đáy 96px) và z-50 để không bao giờ bị che khuất.
          Lưu ý: Nếu nút vẫn lệch, hãy mở file AIChatbox.tsx xóa bỏ thuộc tính `fixed bottom-...` bên trong đi nhé! */}
      <div className="fixed bottom-24 right-4 z-50 pointer-events-auto">
        <AIChatbox />
      </div>

      {/* BOTTOM NAVIGATION BAR CHUẨN ĐIỆN THOẠI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
              activeTab === 'menu' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Utensils className={`w-5 h-5 mb-1 ${activeTab === 'menu' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            Gọi món
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
              activeTab === 'orders' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt className={`w-5 h-5 mb-1 ${activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            Đơn của tôi
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
              activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className={`w-5 h-5 mb-1 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            Thành viên
          </button>
        </div>
      </div>
    </div>
  );
}