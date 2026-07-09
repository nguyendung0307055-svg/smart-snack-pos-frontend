import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Layers,
  ShoppingBag,
  Zap,
  Ticket,
  Users,
  Clock,
  Home,
  LogOut,
  CalendarDays,
  History,
  UtensilsCrossed,
  Bell,
  CalendarClock, // Thêm icon trực quan cho tính năng đăng ký lịch rảnh
} from "lucide-react";
import ingredientService from "../../services/ingredientService";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Layers, label: "Danh mục", path: "/admin/categories" },
  { icon: Package, label: "Sản phẩm", path: "/admin/products" },
  { icon: Warehouse, label: "Kho & Nguyên liệu", path: "/admin/inventory" },
  { icon: UtensilsCrossed, label: "Recipes", path: "/admin/recipes" },
  { icon: Layers, label: "Toppings", path: "/admin/toppings" },
  { icon: ShoppingBag, label: "Đơn hàng", path: "/admin/orders" },
  { icon: History, label: "Lịch sử đơn hàng", path: "/admin/order-history" },
  { icon: Home, label: "Quản lý bàn", path: "/admin/tables" },
  { icon: Users, label: "Nhân viên", path: "/admin/users" },
  { icon: CalendarDays, label: "Lịch làm việc", path: "/admin/schedules" },
  { icon: Clock, label: "Quản lý ca", path: "/admin/shifts" },

  // 1. THÊM MENU ĐĂNG KÝ LỊCH RẢNH VÀO DANH SÁCH KHỞI TẠO TẠI ĐÂY
  { icon: CalendarClock, label: "Đăng ký lịch rảnh", path: "/admin/my-availability" },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState<number>(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 2. PHÂN QUYỀN HIỂN THỊ: Cấp quyền cho ADMIN và STAFF đều nhìn thấy mục này
  const filteredMenuItems =
    user.role === "ADMIN"
      ? menuItems
      : user.role === "STAFF"
        ? menuItems.filter((item) =>
          [
            "/admin/inventory",
            "/admin/orders",
            "/admin/order-history",
            "/admin/tables",
            "/admin/my-availability", // Thêm dòng này để STAFF thấy trên thanh menu
          ].includes(item.path)
        )
        : user.role === "KITCHEN"
          ? menuItems.filter((item) =>
            [
              "/admin/inventory",
              "/admin/my-availability",
            ].includes(item.path)
          )
          : [];

  // 3. ĐIỀU HƯỚNG BẢO VỆ: Đảm bảo STAFF đi vào trang này không bị đẩy về trang kho
  useEffect(() => {
    if (user.role === "STAFF") {
      const blockedRoutes = [
        "/admin", "/admin/users", "/admin/shifts", "/admin/schedules",
        "/admin/vouchers", "/admin/flash-sales",
        "/admin/products", "/admin/categories", "/admin/recipes", "/admin/toppings",
        // Không đưa "/admin/my-availability" vào đây để tránh bị chặn truy cập
      ];
      if (blockedRoutes.includes(location.pathname)) {
        navigate("/admin/inventory");
      }
    }
  }, [location.pathname, navigate, user.role]);

  // Lấy dữ liệu số thông báo ban đầu cho ADMIN
  useEffect(() => {
    if (user.role === "ADMIN") {
      ingredientService
        .getImportRequests()
        .then((data) => {
          const pending = data.filter((item: any) => item.status === "PENDING");
          setRequestCount(pending.length);
        })
        .catch((err) => console.error("Lỗi khi lấy danh sách yêu cầu:", err));
    }
  }, [user.role]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🍹</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">Smart Snack</h2>
              <p className="text-xs text-gray-500">
                {user.role === "ADMIN" ? "Admin Panel" : user.role === "STAFF" ? "Staff Panel" : "Kitchen Panel"}
              </p>
            </div>
          </Link>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-blue-50 text-blue-700" : ""}`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 gap-4 shadow-sm z-10">

          {(user.role === "STAFF" || user.role === "ADMIN") && (
            <Button
              variant="outline"
              onClick={() => navigate("/pos")}
            >
              POS Bán Hàng
            </Button>
          )}

          {(user.role === "KITCHEN" || user.role === "ADMIN") && (
            <Button
              variant="outline"
              onClick={() => navigate("/kitchen")}
            >
              Màn hình bếp
            </Button>
          )}

          {user.role === "ADMIN" && (
            <button
              onClick={() => navigate("/admin/import-requests")}
              className="relative p-2 text-gray-600 hover:text-gray-900 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5" />

              {requestCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-[10px] font-bold h-4 w-4 flex items-center justify-center animate-pulse">
                  {requestCount}
                </span>
              )}
            </button>
          )}

          <div className="text-sm font-medium text-gray-700 bg-slate-100 px-3 py-1.5 rounded-md">
            Xin chào,
            <span className="font-bold text-indigo-600 ml-1">
              {user.role}
            </span>
          </div>

        </header>

        {/* Khu vực hiển thị nội dung các trang */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}