import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LayoutDashboard, ShoppingCart, ChefHat, Smartphone } from 'lucide-react';

export function RoleSelector() {
  const navigate = useNavigate();

  const roles = [
    {
      title: 'Admin Dashboard',
      description: 'Quản lý hệ thống, sản phẩm, kho, báo cáo',
      icon: LayoutDashboard,
      path: '/admin',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'POS - Thu Ngân',
      description: 'Tạo đơn hàng, thanh toán, quản lý bàn',
      icon: ShoppingCart,
      path: '/pos',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Kitchen Display',
      description: 'Màn hình bếp, xem và xử lý đơn hàng',
      icon: ChefHat,
      path: '/kitchen',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'QR Menu - Khách hàng',
      description: 'Menu đặt món qua QR code tại bàn',
      icon: Smartphone,
      path: '/menu/tb2',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🍹 Smart Snack POS</h1>
          <p className="text-xl text-gray-600">Hệ thống quản lý quán đồ ăn vặt & trà sữa</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.path} className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(role.path)}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl ${role.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg" onClick={() => navigate(role.path)}>
                    Mở giao diện
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Demo version - All data is stored locally</p>
        </div>
      </div>
    </div>
  );
}
