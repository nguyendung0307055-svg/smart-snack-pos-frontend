import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Eye, 
  RefreshCcw, 
  Search, 
  Receipt, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

import orderService from "../../../services/orderService";

// ============================================================================
// DEFINING INTERFACES
// ============================================================================
interface OrderItem {
  productName: string;
  image: string;
  sizeName: string;
  quantity: number;
  price: number | string;
  toppings?: string;
  totalPrice: number | string;
}

interface Order {
  id: number;
  orderNumber: string;
  tableId: number;
  orderType: "DINE_IN" | "TAKE_AWAY";
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  totalAmount: number | string;
  status: "PENDING" | "COOKING" | "DONE" | string;
  paymentStatus: "PAID" | "UNPAID" | string;
  paymentMethod?: string;
  transactionCode?: string;
  note?: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // PHÂN TRANG STATES
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // Số lượng đơn hàng trên mỗi trang

  //----------------------------------------------------
  // LOAD DATA
  //----------------------------------------------------
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      setOrders(res.data || []);
      // Reset về trang 1 khi tải lại dữ liệu tổng thể
      setCurrentPage(1);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  //----------------------------------------------------
  // ACTION HANDLERS
  //----------------------------------------------------
  const handleUpdateStatus = async (orderId: number, currentStatus: string) => {
    try {
      setActionLoading(orderId);
      const nextStatus = currentStatus === "PENDING" ? "COOKING" : "DONE";
      await orderService.updateStatus(orderId, nextStatus);
      await loadOrders();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletePayment = async (orderId: number) => {
    try {
      setActionLoading(orderId);
      await orderService.completePayment(orderId);
      await loadOrders();
    } catch (err) {
      console.error("Lỗi khi thanh toán đơn hàng:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      const res = await orderService.getOrderById(orderId);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", err);
    }
  };

  //----------------------------------------------------
  // FILTER LOGIC & PAGINATION RESET
  //----------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesKeyword = o.orderNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" ? true : o.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Mỗi khi filter thay đổi, tự động quay về trang đầu tiên để tránh bị rỗng trang
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  // Tính toán dữ liệu thực tế hiển thị cho trang hiện tại
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  //----------------------------------------------------
  // STATISTICS COMPUTATION
  //----------------------------------------------------
  const stats = useMemo(() => {
    return orders.reduce(
      (acc, item) => {
        if (item.paymentStatus === "PAID") {
          acc.totalRevenue += Number(item.totalAmount || 0);
        }
        if (item.status === "PENDING") acc.pending++;
        if (item.status === "COOKING") acc.cooking++;
        return acc;
      },
      { totalRevenue: 0, pending: 0, cooking: 0 }
    );
  }, [orders]);

  //----------------------------------------------------
  // RENDER HELPERS (UI Badges & Labels)
  //----------------------------------------------------
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Chờ xác nhận</Badge>;
      case "COOKING":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Đang chế biến</Badge>;
      case "DONE":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    return status === "PAID" ? (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Đã thanh toán</Badge>
    ) : (
      <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200">Chưa thanh toán</Badge>
    );
  };

  const getTableLabel = (tableId: number) => {
    return tableId ? `Bàn ${tableId}` : "Mang đi";
  };

  // Hàm tạo dãy số trang (Ví dụ: 1, 2, 3...)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý và điều phối tất cả các đơn hàng tại quán</p>
        </div>
        <Button onClick={loadOrders} disabled={loading} size="sm" className="shadow-sm">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
          Làm mới dữ liệu
        </Button>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang chế biến</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.cooking}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tạm tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.totalRevenue.toLocaleString("vi-VN")}₫
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm nhanh theo mã đơn hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                <SelectItem value="COOKING">Đang chế biến</SelectItem>
                <SelectItem value="DONE">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ORDERS DATA TABLE */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Danh sách đơn hàng cần xử lý
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="font-semibold">Mã đơn</TableHead>
                  <TableHead className="font-semibold">Vị trí</TableHead>
                  <TableHead className="font-semibold">Loại đơn</TableHead>
                  <TableHead className="font-semibold">Thời gian đặt</TableHead>
                  <TableHead className="font-semibold">Tổng tiền</TableHead>
                  <TableHead className="font-semibold">Trạng thái phục vụ</TableHead>
                  <TableHead className="font-semibold">Thanh toán</TableHead>
                  <TableHead className="font-semibold">PTTT</TableHead>
                  <TableHead className="text-center font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        Đang truy xuất dữ liệu đơn hàng...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Không tìm thấy đơn hàng nào phù hợp với điều kiện lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium tracking-wide">{order.orderNumber}</TableCell>
                      <TableCell>{getTableLabel(order.tableId)}</TableCell>
                      <TableCell>{order.orderType === "DINE_IN" ? "Ăn tại quán" : "Mang đi"}</TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(order.totalAmount).toLocaleString("vi-VN")}₫
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {order.paymentMethod ?? "--"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center items-center">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleViewDetails(order.id)}>
                            <Eye className="w-4 h-4 mr-1" /> Chi tiết
                          </Button>
                          
                          {order.status !== "DONE" && (
                            <Button 
                              size="sm" 
                              className="h-8"
                              disabled={actionLoading === order.id}
                              onClick={() => handleUpdateStatus(order.id, order.status)}
                            >
                              {actionLoading === order.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              {order.status === "PENDING" ? "Bắt đầu nấu" : "Hoàn thành nấu"}
                            </Button>
                          )}

                          {order.paymentStatus === "UNPAID" && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                              disabled={actionLoading === order.id}
                              onClick={() => handleCompletePayment(order.id)}
                            >
                              {actionLoading === order.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                              Tính tiền
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* UI PHÂN TRANG (PAGINATION BAR) */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 bg-slate-50/50">
              {/* Bên trái: Thông tin số lượng */}
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Hiển thị từ <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> đến{" "}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> trong tổng số{" "}
                <span className="font-medium">{totalItems}</span> đơn hàng
              </div>

              {/* Bên phải: Các nút điều hướng và chọn Page Size */}
              <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
                {/* Chọn số dòng hiển thị trên một trang */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium whitespace-nowrap">Số dòng mỗi trang</p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[5, 10, 20, 30, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Số trang hiện tại */}
                <div className="flex w-[100px] items-center justify-center text-sm font-medium whitespace-nowrap">
                  Trang {currentPage} / {totalPages}
                </div>

                {/* Cụm Button điều hướng */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <span className="sr-only">Về trang đầu</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <span className="sr-only">Trang trước</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Hiển thị danh sách số trang dạng 1 2 3 nhỏ gọn */}
                  <div className="hidden sm:flex items-center gap-1">
                    {pageNumbers.map((page) => {
                      // Logic để thu gọn nếu có quá nhiều trang (tùy chọn, hiện tại render hết)
                      if (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            className="h-8 w-8 p-0 text-sm"
                            onClick={() => setCurrentPage(page)}
                            disabled={loading}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-1 text-muted-foreground text-sm">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                  >
                    <span className="sr-only">Trang sau</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || loading}
                  >
                    <span className="sr-only">Đến trang cuối</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Chi tiết hóa đơn: <span className="text-indigo-600">{selectedOrder?.orderNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4">
              {/* INFORMATION OVERVIEW METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Hình thức</p>
                  <p className="font-semibold text-sm mt-0.5">
                    {selectedOrder.orderType === "DINE_IN" ? "🏠 Ăn tại quán" : "🛍️ Mang đi"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Vị trí ghế ngồi</p>
                  <p className="font-semibold text-sm mt-0.5">{getTableLabel(selectedOrder.tableId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Trạng thái bếp</p>
                  <div className="mt-0.5">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Thu ngân</p>
                  <div className="mt-0.5">{getPaymentBadge(selectedOrder.paymentStatus)}</div>
                </div>
              </div>

              {/* TIMELINE DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-b pb-4 border-dashed">
                <div>
                  <span className="text-muted-foreground">Thời gian khởi tạo: </span>
                  <span className="font-medium">
                    {format(new Date(selectedOrder.createdAt), "HH:mm - dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Thanh toán lúc: </span>
                  <span className="font-medium">
                    {selectedOrder.paidAt ? format(new Date(selectedOrder.paidAt), "HH:mm - dd/MM/yyyy", { locale: vi }) : "--"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hoàn tất phục vụ: </span>
                  <span className="font-medium">
                    {selectedOrder.completedAt ? format(new Date(selectedOrder.completedAt), "HH:mm - dd/MM/yyyy", { locale: vi }) : "--"}
                  </span>
                </div>
              </div>

              {/* ADDITIONAL TRANSACTION METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phương thức thanh toán: </span>
                  <Badge variant="outline" className="ml-1 bg-slate-50">
                    {selectedOrder.paymentMethod ?? "Chưa chỉ định"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Mã giao dịch (Banking): </span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {selectedOrder.transactionCode ?? "Không có"}
                  </span>
                </div>
              </div>

              {/* USER NOTES IF AVAILABLE */}
              {selectedOrder.note && (
                <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-lg text-sm">
                  <strong className="block mb-1">📌 Ghi chú từ khách hàng:</strong>
                  {selectedOrder.note}
                </div>
              )}

              <Separator />

              {/* PRODUCT ITEM LIST */}
              <div>
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span>🛒 Danh mục món ăn đã chọn ({selectedOrder.items.length})</span>
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 border rounded-xl p-3 bg-white hover:shadow-sm transition-shadow items-center">
                      <img
                        src={item.image || "https://placehold.co/100x100?text=No+Image"}
                        alt={item.productName}
                        className="w-16 h-16 rounded-lg object-cover border bg-slate-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{item.productName}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span>Kích cỡ: <b className="text-slate-700">{item.sizeName}</b></span>
                          <span>Số lượng: <b className="text-slate-700">x{item.quantity}</b></span>
                          <span>Đơn giá: <b className="text-slate-700">{Number(item.price).toLocaleString("vi-VN")}₫</b></span>
                        </div>
                        {item.toppings && (
                          <p className="text-xs text-muted-foreground mt-1 bg-slate-50 p-1 rounded border border-slate-100 inline-block">
                            Topping thêm: <span className="text-slate-600 font-medium">{item.toppings}</span>
                          </p>
                        )}
                      </div>
                      <div className="font-bold text-indigo-600 text-base text-right flex-shrink-0">
                        {Number(item.totalPrice).toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* SUMMARY TOTAL PRICING SECTION */}
              <div className="flex justify-end pt-2">
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">Tổng tiền thanh toán thực tế</p>
                  <h2 className="text-3xl font-black text-emerald-600 tracking-tight">
                    {Number(selectedOrder.totalAmount).toLocaleString("vi-VN")}₫
                  </h2>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}