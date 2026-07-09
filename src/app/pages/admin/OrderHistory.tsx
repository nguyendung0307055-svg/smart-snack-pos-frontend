import { useEffect, useState } from 'react';
import orderService from '../../../services/orderService'; // Đồng bộ service từ POS

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../../components/ui/card';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';

import { 
    Search, 
    Receipt, 
    Eye, 
    Loader2, 
    DollarSign, 
    ShoppingBag, 
    TrendingUp,
    Clock,
    ChefHat,
    CheckCircle2,
    Package,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function OrderHistory() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Các state quản lý phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng đơn hàng hiển thị trên mỗi trang

    // Tải dữ liệu thực tế từ API tương tự như POS
    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset về trang 1 khi người dùng tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getAllOrders();
            const orderList = response.data || [];

            // Logic sắp xếp mới nhất lên đầu của POS
            const sortedOrders = [...orderList].sort((a: any, b: any) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setOrders(sortedOrders);
        } catch (error) {
            console.error('Lỗi khi tải lịch sử đơn hàng:', error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm cấu hình Badge trạng thái đồng bộ với POS
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
                    label: 'Đang nấu',
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: <ChefHat className="w-3.5 h-3.5" />
                };
            case 'DONE':
                return {
                    label: 'Hoàn thành',
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />
                };
            default:
                return {
                    label: 'Không xác định',
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <Package className="w-3.5 h-3.5" />
                };
        }
    };

    // Tìm kiếm theo Mã đơn hàng (orderNumber)
    const filteredOrders = orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tính toán dữ liệu phân trang
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Lấy mảng dữ liệu thuộc trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Hàm sinh dãy số trang hiển thị thông minh (ví dụ: 1 2 3 ... hoặc gói gọn nếu ít trang)
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pageNumbers.push(i);
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                pageNumbers.push(currentPage - 1);
                pageNumbers.push(currentPage);
                pageNumbers.push(currentPage + 1);
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    // Tính toán Thống kê dựa trên dữ liệu thật từ API (Tính toán trên TOÀN BỘ danh sách)
    const totalRevenue = orders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Lịch sử đơn hàng (Admin)
                </h1>
                <p className="text-slate-500 mt-1">
                    Quản lý và tra cứu chi tiết toàn bộ hóa đơn hệ thống dữ liệu thực tế
                </p>
            </div>

            {/* Thống kê Tổng quan */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Tổng doanh thu thực tế
                        </CardTitle>
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">
                            {totalRevenue.toLocaleString('vi-VN')}₫
                        </div>
                        <p className="text-xs text-slate-400 mt-1">* Chỉ tính các đơn đã thanh toán</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Tổng lượng đơn hàng
                        </CardTitle>
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">
                            {totalOrders}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Bao gồm toàn bộ trạng thái</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Giá trị TB / Đơn hàng
                        </CardTitle>
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-600">
                            {Math.round(averageOrder).toLocaleString('vi-VN')}₫
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Hiệu suất chi tiêu của khách</p>
                    </CardContent>
                </Card>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="mb-6 flex justify-between items-center gap-4">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        placeholder="Tìm kiếm chính xác theo mã đơn hàng (Ví dụ: 1002)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-slate-200 rounded-xl shadow-sm"
                    />
                </div>
                <Button variant="outline" onClick={fetchOrders} className="rounded-xl shadow-sm">
                    Làm mới dữ liệu
                </Button>
            </div>

            {/* Bảng Danh sách Đơn hàng */}
            <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col justify-between">
                <div>
                    <CardHeader className="border-b bg-white">
                        <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                            <Receipt className="w-5 h-5 text-primary" />
                            Danh sách hóa đơn hệ thống
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                <p className="text-slate-500 font-medium">Đang đồng bộ dữ liệu từ API...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-slate-400 font-medium">Không tìm thấy đơn hàng nào phù hợp.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700">Mã đơn</TableHead>
                                        <TableHead className="font-bold text-slate-700">Vị trí</TableHead>
                                        <TableHead className="font-bold text-slate-700">Thời gian đặt</TableHead>
                                        <TableHead className="font-bold text-slate-700">Trạng thái xử lý</TableHead>
                                        <TableHead className="font-bold text-slate-700">Tổng tiền</TableHead>
                                        <TableHead className="font-bold text-slate-700">Thanh toán</TableHead>
                                        <TableHead className="font-bold text-slate-700">Hình thức</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status);
                                        return (
                                            <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                                <TableCell className="font-black text-slate-900">#{order.orderNumber}</TableCell>
                                                <TableCell className="font-medium text-slate-600">
                                                    {order.tableId ? `Bàn ${order.tableId}` : 'Mang về'}
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {format(new Date(order.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`flex items-center gap-1 w-fit shadow-sm border ${statusConfig.color}`}>
                                                        {statusConfig.icon}
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-primary">
                                                    {(order.totalAmount || order.total)?.toLocaleString('vi-VN')}₫
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`shadow-sm border ${
                                                        order.paymentStatus === 'PAID'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                        {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa trả'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-600">
                                                    {order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'CASH' ? 'Tiền mặt' : '---'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="rounded-xl hover:bg-slate-100"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Chi tiết
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </div>

                {/* THÀNH PHẦN PHÂN TRANG (PAGINATION INTERFACE) */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t bg-white">
                        <div className="text-sm text-slate-500 font-medium">
                            Hiển thị <span className="font-semibold text-slate-700">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(indexOfLastItem, totalItems)}</span> trong tổng số <span className="font-semibold text-slate-700">{totalItems}</span> đơn hàng
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            {/* Nút Quay lại */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-xl shadow-sm border-slate-200"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {/* Danh sách số trang 1 2 3... */}
                            {getPageNumbers().map((page, idx) => {
                                if (page === '...') {
                                    return (
                                        <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-medium">
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <Button
                                        key={`page-${page}`}
                                        variant={currentPage === page ? "default" : "outline"}
                                        className={`w-9 h-9 rounded-xl font-bold shadow-sm ${
                                            currentPage === page 
                                                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                        onClick={() => setCurrentPage(page as number)}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}

                            {/* Nút Tiếp theo */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-xl shadow-sm border-slate-200"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Dialog Chi tiết hóa đơn */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-800">
                            <Receipt className="w-6 h-6 text-primary" />
                            Chi tiết hóa đơn #{selectedOrder?.orderNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-5">
                            {/* Thông tin metadata đơn hàng */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí phục vụ</p>
                                    <p className="font-bold text-slate-800 mt-0.5">
                                        {selectedOrder.tableId ? `Bàn ${selectedOrder.tableId}` : 'Mang đi / Mang về'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian tạo đơn</p>
                                    <p className="font-bold text-slate-800 mt-0.5">
                                        {format(new Date(selectedOrder.createdAt), 'HH:mm:ss - dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>
                            </div>

                            {/* Danh sách món ăn */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-3 text-sm uppercase tracking-wider text-slate-400">
                                    Danh sách món ăn hệ thống xử lý
                                </h3>
                                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                                    {selectedOrder.items?.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800">
                                                    {item.quantity}x {item.productName}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {item.sizeName && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                                                            Size: {item.sizeName}
                                                        </span>
                                                    )}
                                                    {item.toppings && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 italic">
                                                            + {item.toppings}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="font-black text-primary">
                                                {(item.totalPrice || (item.price * item.quantity))?.toLocaleString('vi-VN')}₫
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ghi chú nếu có */}
                            {selectedOrder.note && (
                                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                    <p className="text-xs font-bold text-yellow-700 uppercase mb-0.5">Ghi chú từ POS</p>
                                    <p className="text-sm text-yellow-800">{selectedOrder.note}</p>
                                </div>
                            )}

                            <Separator className="bg-slate-100" />

                            {/* Tính toán Tổng thanh toán */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-lg pt-1">
                                    <span className="font-bold text-slate-800">Tổng doanh thu nhận về:</span>
                                    <span className="font-black text-2xl text-primary">
                                        {(selectedOrder.totalAmount || selectedOrder.total)?.toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Phương thức giao dịch:</span>
                                    <Badge variant="outline" className="font-bold px-3 py-1 bg-slate-100 text-slate-800 border-slate-200">
                                        {selectedOrder.paymentMethod === 'VNPAY' ? 'Ví điện tử VNPay' : selectedOrder.paymentMethod === 'CASH' ? 'Tiền mặt tại quầy' : 'Chưa định nghĩa'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}