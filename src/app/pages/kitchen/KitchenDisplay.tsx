import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
  ChefHat,
  Clock,
  CheckCircle,
  LogOut,
  Loader2,
  LogIn,
  AlertTriangle,
  PlusCircle,
  Clock as ClockIcon
} from 'lucide-react';

import { format, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';

import { toast } from 'sonner';

import { notificationSound } from '../../utils/notificationSound';

import orderService from '../../../services/orderService';
import ingredientService from '../../../services/ingredientService';
import scheduleService from '../../../services/scheduleService';

export function KitchenDisplay() {
  const navigate = useNavigate();

  const [kitchenOrders, setKitchenOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockIngredients, setLowStockIngredients] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; name: string; role: string } | null>(null);

  // REALTIME CLOCK & TIME MANAGEMENT
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);

  // STATES CHẤM CÔNG BẾP (ATTENDANCE)
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [showConfirmCheckOut, setShowConfirmCheckOut] = useState(false);

  const lastPendingCountRef = useRef<number>(0);
  const MAX_DONE_DISPLAY_MINUTES = 480;

  // Hàm fetch đơn hàng chung
  const fetchOrders = async () => {
    try {
      const response = await orderService.getAllOrders();
      const orders = response.data || [];
      setKitchenOrders(orders);

      const pendingCount = orders.filter((o: any) => o.status === 'PENDING').length;
      if (pendingCount > lastPendingCountRef.current) {
        notificationSound.playBell();
        toast.success(`Có đơn hàng mới cần xử lý!`);
      }
      lastPendingCountRef.current = pendingCount;
    } catch (error) {
      console.error("Lỗi fetch đơn hàng:", error);
    }
  };

  // Hàm fetch nguyên liệu chung
  const fetchIngredients = async () => {
    try {
      const ingredients = await ingredientService.getAll();
      const lowStock = ingredients.filter(
        (item: any) => item.stockQuantity <= item.minimumStock
      );
      setLowStockIngredients(lowStock);
    } catch (error) {
      console.error("Lỗi fetch nguyên liệu:", error);
    }
  };

  // 1. Effect chạy đồng hồ Realtime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Kiểm tra thông tin User & Lịch trực hôm nay của Bếp khi vừa vào trang
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let userObj: any = null;
    if (storedUser) {
      try {
        userObj = JSON.parse(storedUser);
        setCurrentUser(userObj);
      } catch (e) {
        console.error("Lỗi parse thông tin user", e);
      }
    } else {
      toast.error("Vui lòng đăng nhập hệ thống!");
      navigate('/');
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // NẾU LÀ ADMIN/CHỦ QUÁN: Bỏ qua chấm công lịch trực, cho phép xem bếp luôn
        if (userObj?.role === 'ADMIN' || userObj?.role === 'OWNER') {
          setIsCheckedIn(true);
          await Promise.all([fetchOrders(), fetchIngredients()]);
          return;
        }

        // ĐỐI VỚI NHÂN VIÊN BẾP THƯỜNG: Kiểm tra lịch trực và đồng bộ chấm công cũ
        const scheduleData = await scheduleService.getMyScheduleToday();
        
        if (scheduleData && scheduleData.id) {
          setTodaySchedule(scheduleData);
          
          if (userObj && userObj.id) {
            const attendanceHistory = await scheduleService.getAttendanceHistory(userObj.id);
            
            const todayAttendance = attendanceHistory.find(
              (att: any) => att.schedule && att.schedule.id === scheduleData.id
            );

            if (todayAttendance) {
              if (todayAttendance.checkIn) {
                setIsCheckedIn(true);
                setShiftStartTime(new Date(todayAttendance.checkIn));
              }
              if (todayAttendance.checkOut) {
                setIsCheckedOut(true);
              }
              
              if (todayAttendance.checkIn && !todayAttendance.checkOut) {
                await Promise.all([fetchOrders(), fetchIngredients()]);
              }
            }
          }
        }
      } catch (err: any) {
        console.log("Hôm nay nhân viên bếp chưa có ca trực hoặc lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // 3. Vòng lặp tự động cập nhật dữ liệu mỗi 3 giây (Chỉ hoạt động khi đang làm việc)
  useEffect(() => {
    if (!isCheckedIn || isCheckedOut) return;

    const interval = setInterval(() => {
      fetchOrders();
      fetchIngredients();
    }, 3000);

    return () => clearInterval(interval);
  }, [isCheckedIn, isCheckedOut]);

  // NGHIỆP VỤ CHẤM CÔNG CỦA BẾP
  const handleCheckInClick = async () => {
    if (!todaySchedule || !todaySchedule.id) {
      return toast.error("Hệ thống không tìm thấy lịch trực hôm nay của bạn!");
    }
    try {
      const res = await scheduleService.checkIn(todaySchedule.id);
      notificationSound.playBell();
      
      setShiftStartTime(res.checkIn ? new Date(res.checkIn) : new Date());
      setIsCheckedIn(true);
      
      fetchOrders();
      fetchIngredients();
      toast.success("Đầu bếp vào ca (Check In) thành công!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Vào ca thất bại hoặc bạn đã check-in trước đó!");
    }
  };

  const handleCheckOutConfirm = async () => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER') {
      setIsCheckedOut(true);
      toast.success("Admin đã đóng phiên làm việc của bếp!");
      setShowConfirmCheckOut(false);
      return;
    }

    if (!todaySchedule || !todaySchedule.id) return;
    try {
      await scheduleService.checkOut(todaySchedule.id);
      setIsCheckedOut(true);
      toast.success("Đầu bếp rời ca (Check Out) thành công!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xuống ca thất bại!");
    } finally {
      setShowConfirmCheckOut(false);
    }
  };

  const handleSendImportRequest = () => {
    toast.info("Đang chuyển hướng đến trang gửi yêu cầu nhập hàng...");
    navigate("/admin/import-requests");
  };

  const updateOrderStatus = async (orderId: number, newStatus: 'COOKING' | 'DONE') => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      setKitchenOrders(prev => {
        const updated = prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, completedAt: newStatus === 'DONE' ? new Date().toISOString() : order.completedAt }
            : order
        );
        lastPendingCountRef.current = updated.filter((o: any) => o.status === 'PENDING').length;
        return updated;
      });

      if (newStatus === 'DONE') {
        notificationSound.playDoubleBell();
        toast.success('Món đã hoàn thành!');
      } else {
        toast.success('Đã bắt đầu nấu');
      }
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const getTableNumber = (tableId?: any) => !tableId ? 'Mang đi' : `Bàn ${tableId}`;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 border-yellow-300';
      case 'COOKING': return 'bg-blue-100 border-blue-300';
      case 'DONE': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING': return <Badge className="bg-yellow-500">Chờ xử lý</Badge>;
      case 'COOKING': return <Badge className="bg-blue-500">Đang nấu</Badge>;
      case 'DONE': return <Badge className="bg-green-600">Hoàn thành</Badge>;
      default: return <Badge variant="secondary">Không xác định</Badge>;
    }
  };

  const getWaitTimeMinutes = (createdAtString: string) => {
    const createdTime = new Date(createdAtString).getTime();
    const diffMs = currentTime.getTime() - createdTime;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const pendingOrders = kitchenOrders.filter((o) => o.status === 'PENDING');
  const cookingOrders = kitchenOrders.filter((o) => o.status === 'COOKING');
  const totalDoneOrders = kitchenOrders.filter((o) => o.status === 'DONE');

  const visibleDoneOrders = totalDoneOrders.filter((order) => {
    if (!order.completedAt) return false;
    const completedTime = new Date(order.completedAt).getTime();
    const diffMinutes = (currentTime.getTime() - completedTime) / 1000 / 60;
    return diffMinutes < MAX_DONE_DISPLAY_MINUTES;
  });

  const workTime = shiftStartTime ? differenceInMinutes(currentTime, shiftStartTime) : 0;

  const renderOrderItems = (items: any[]) => {
    return items.map((item: any, index: number) => (
      <div key={index} className="bg-white p-3 rounded-2xl border flex gap-3">
        <img src={item.image || '/no-image.png'} className="w-20 h-20 rounded-xl object-cover border" alt="" />
        <div className="flex-1">
          <div className="flex justify-between gap-3">
            <div>
              <p className="font-bold text-gray-800">{item.quantity}x {item.productName}</p>
              {item.sizeName && <p className="text-sm text-gray-600">Size: {item.sizeName}</p>}
              {item.toppings && <p className="text-sm text-gray-600 italic">+ {item.toppings}</p>}
            </div>
            <div className="text-right">
              <p className="font-black text-blue-600">{item.totalPrice?.toLocaleString()}₫</p>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  const isAdminOrOwner = currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Đang kiểm tra quyền và ca trực bếp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER TÍCH HỢP CHẤM CÔNG */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">Màn Hình Điều Phối Bếp</h1>
            <p className="text-slate-500 mt-1">
              Nhân viên: <span className="font-bold text-slate-700">{currentUser?.name || currentUser?.username}</span> 
              {isAdminOrOwner && <Badge className="ml-2 bg-purple-600">Quyền Admin</Badge>} • {format(currentTime, 'HH:mm:ss dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cụm nút chấm công cho nhân viên bếp thường */}
          {!isAdminOrOwner && (
            <>
              <Button
                variant="default"
                onClick={handleCheckInClick}
                disabled={isCheckedIn || !todaySchedule}
                className={`font-bold rounded-xl shadow-md ${isCheckedIn ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                {isCheckedIn ? "Đã Check In Bếp" : "Nhận Ca Bếp (Check In)"}
              </Button>

              <Button
                variant="default"
                onClick={() => setShowConfirmCheckOut(true)}
                disabled={!isCheckedIn || isCheckedOut}
                className={`font-bold rounded-xl shadow-md ${(!isCheckedIn || isCheckedOut) ? 'bg-gray-100 text-gray-400' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                {isCheckedOut ? "Đã Giao Ca" : "Xuống Ca Bếp (Check Out)"}
              </Button>
            </>
          )}

          {/* Nút đóng phiên chế biến nhanh dành cho Admin/Owner */}
          {isAdminOrOwner && !isCheckedOut && (
            <Button
              variant="outline"
              onClick={() => setShowConfirmCheckOut(true)}
              className="font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
            >
              Tạm đóng màn hình bếp
            </Button>
          )}

          {shiftStartTime && !isCheckedOut && !isAdminOrOwner && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">Đã đứng bếp: {Math.floor(workTime / 60)}h {workTime % 60}m</span>
            </div>
          )}

          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/')}>Quay lại</Button>
        </div>
      </header>

      {/* THÂN MÀN HÌNH CHÍNH */}
      <div className="p-6">
        
        {/* BANNER THÔNG BÁO THIẾU NGUYÊN LIỆU */}
        {lowStockIngredients.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-red-700 font-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                CẢNH BÁO KHO BẾP SẮP HẾT NGUYÊN LIỆU:
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {lowStockIngredients.map((item: any) => (
                  <span key={item.id} className="text-sm text-red-600 font-bold">
                    • {item.name} (Còn tồn: {item.stockQuantity})
                  </span>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleSendImportRequest}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md whitespace-nowrap flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Yêu cầu nhập nguyên liệu
            </Button>
          </div>
        )}

        {/* THỐNG KÊ SỐ LƯỢNG ĐƠN */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <ChefHat className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Đang nấu</p>
              <p className="text-3xl font-bold text-blue-600">{cookingOrders.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Tổng hoàn thành</p>
              <p className="text-3xl font-bold text-green-600">{totalDoneOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* ĐIỀU KIỆN HIỂN THỊ: PHẢI CHECK IN MỚI THẤY ĐƠN HÀNG */}
        {!isCheckedIn ? (
          <div className="text-center py-20 bg-white border rounded-2xl shadow-sm">
            <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">Bạn chưa vào ca làm việc</h3>
            <p className="text-gray-400 mt-1 mb-4">Vui lòng nhấn nút "Nhận Ca Bếp (Check In)" phía trên để bắt đầu theo dõi và chế biến món ăn.</p>
          </div>
        ) : isCheckedOut ? (
          <div className="text-center py-20 bg-white border rounded-2xl shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">Đã hoàn thành phiên làm việc</h3>
            <p className="text-gray-400 mt-1">Cảm ơn bạn! Hẹn gặp lại vào ca làm việc tiếp theo.</p>
          </div>
        ) : (
          /* BA CỘT TRẠNG THÁI ĐƠN HÀNG */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* CỘT 1: PENDING */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold">Chờ xử lý ({pendingOrders.length})</h2>
              </div>
              <div className="space-y-4">
                {pendingOrders.map((order) => {
                  const minutesWaiting = getWaitTimeMinutes(order.createdAt);
                  const isOverdue = minutesWaiting > 15;
                  return (
                    <Card key={order.id} className={`border-2 ${getStatusColor(order.status)} ${isOverdue ? "ring-2 ring-red-500 animate-pulse" : ""}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                            <p className="text-sm text-gray-600">{getTableNumber(order.tableId)}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">Tạo lúc: {format(new Date(order.createdAt), 'HH:mm')}</p>
                          <p className="text-xs text-red-500 font-semibold">Đã chờ: {minutesWaiting} phút</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {renderOrderItems(order.items)}
                        {order.note && (
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                            <p className="text-sm text-yellow-800">{order.note}</p>
                          </div>
                        )}
                        <Button
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => updateOrderStatus(order.id, 'COOKING')}
                        >
                          <ChefHat className="w-4 h-4 mr-2" /> Bắt đầu nấu
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* CỘT 2: COOKING */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold">Đang nấu ({cookingOrders.length})</h2>
              </div>
              <div className="space-y-4">
                {cookingOrders.map((order) => (
                  <Card key={order.id} className={`border-2 ${getStatusColor(order.status)}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <p className="text-sm text-gray-600">{getTableNumber(order.tableId)}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {renderOrderItems(order.items)}
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => updateOrderStatus(order.id, 'DONE')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Hoàn thành
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CỘT 3: DONE */}
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-bold">Hoàn thành ({visibleDoneOrders.length})</h2>
                </div>
              </div>
              <div className="space-y-4">
                {visibleDoneOrders.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-2xl text-gray-400 text-sm bg-white">
                    Không có đơn hoàn thành gần đây
                  </div>
                ) : (
                  visibleDoneOrders.map((order) => (
                    <Card key={order.id} className={`border ${getStatusColor(order.status)} opacity-85 shadow-sm`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-md font-bold text-gray-700">{order.orderNumber}</CardTitle>
                            <p className="text-xs text-gray-600">{getTableNumber(order.tableId)}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 bg-white rounded-b-2xl mt-2">
                        <div className="space-y-1 pt-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 flex justify-between">
                              <span className="font-semibold">• {item.quantity}x {item.productName}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG XÁC NHẬN XUỐNG CA / ĐÓNG PHIÊN */}
      <AlertDialog open={showConfirmCheckOut} onOpenChange={setShowConfirmCheckOut}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận rời khỏi màn hình bếp?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdminOrOwner 
                ? "Bạn có chắc chắn muốn tạm thời đóng hoặc ẩn phiên làm việc của bếp không?" 
                : "Hệ thống sẽ thực hiện Check Out (ghi nhận xuống ca trực) cho bạn. Bạn chắc chắn chứ?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckOutConfirm} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
              Xác nhận đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}