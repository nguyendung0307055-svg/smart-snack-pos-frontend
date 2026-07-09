import { useEffect, useState } from 'react';
import orderService from '../../../services/orderService';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../../components/ui/card';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

import {
    ArrowLeft,
    Clock,
    ChefHat,
    CheckCircle2,
    Package,
    Loader2,
    ReceiptText,
    CreditCard,
    Wallet,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { useNavigate } from 'react-router';
import paymentService from '../../../services/paymentService';

// Cấu hình số lượng đơn hàng trên mỗi trang
const ITEMS_PER_PAGE = 6;

export function OrderTrackingPage() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State xử lý phân trang
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {

        fetchOrders();

        const interval = setInterval(() => {
            fetchOrders();
        }, 5000);

        return () => clearInterval(interval);

    }, []);

    const continuePayment = async (
        order: any,
        method: 'cash' | 'vnpay'
    ) => {

        try {

            // CASH
            if (method === 'cash') {

                await paymentService.cashPayment(
                    order.id
                );

                alert('Thanh toán tiền mặt thành công');

                fetchOrders();

                return;
            }

            // VNPAY
            const response =
                await paymentService.createVnpay(
                    order.id
                );

            window.open(
                response.data,
                '_blank'
            );

        } catch (error) {

            console.error(error);

            alert('Thanh toán thất bại');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await orderService.getAllOrders();

            // Lấy dữ liệu mảng từ response
            const orderList = response.data || [];

            // Sắp xếp theo thứ tự giảm dần của ngày tạo (createdAt mới nhất lên đầu)
            const sortedOrders = [...orderList].sort((a: any, b: any) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setOrders(sortedOrders);

        } catch (error) {
            console.error('Lỗi khi tải đơn hàng:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {

        switch (status) {

            case 'PENDING':
                return {
                    label: 'Chờ xử lý',
                    color: 'bg-amber-100 text-amber-700 border-amber-200',
                    icon: <Clock className="w-4 h-4 animate-pulse" />
                };

            case 'COOKING':
                return {
                    label: 'Đang nấu',
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: <ChefHat className="w-4 h-4 animate-bounce" />
                };

            case 'DONE':
                return {
                    label: 'Hoàn thành',
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: <CheckCircle2 className="w-4 h-4" />
                };

            default:
                return {
                    label: 'Không xác định',
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <Package className="w-4 h-4" />
                };
        }
    };

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    
    // Điều chỉnh lại currentPage nếu số lượng đơn hàng giảm đột ngột (ví dụ khi xóa/bộ lọc đổi)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [orders.length, totalPages, currentPage]);

    // Lấy danh sách đơn hàng cho trang hiện tại
    const currentOrders = orders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Tạo mảng số trang hiển thị (Ví dụ: [1, 2, 3])
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex flex-col justify-between">
            
            {/* TOP CONTENT WRAPPER */}
            <div className="w-full flex-1 mb-8">
                {/* HEADER */}
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <ReceiptText className="w-10 h-10 text-primary" />
                            Theo dõi đơn hàng
                        </h1>

                        <p className="text-slate-500 mt-1">
                            Cập nhật trạng thái món ăn theo thời gian thực
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate('/pos')}
                        className="w-fit shadow-sm rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại POS
                    </Button>

                </div>

                {/* CONTENT */}
                <div className="max-w-7xl mx-auto">

                    {loading && orders.length === 0 ? (

                        <div className="flex flex-col items-center justify-center py-20">

                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />

                            <p className="text-slate-500 font-medium">
                                Đang tải dữ liệu...
                            </p>

                        </div>

                    ) : orders.length === 0 ? (

                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">

                            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />

                            <h3 className="text-xl font-bold text-slate-700">
                                Chưa có đơn hàng nào
                            </h3>

                            <p className="text-slate-500">
                                Các đơn hàng mới sẽ xuất hiện tại đây.
                            </p>

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {currentOrders.map((order) => {

                                const status = getStatusConfig(order.status);

                                return (

                                    <Card
                                        key={order.id}
                                        className={`overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl ${order.status === 'DONE'
                                            ? 'opacity-80'
                                            : 'hover:ring-2 hover:ring-primary/20'
                                            }`}
                                    >

                                        {/* HEADER CARD */}
                                        <CardHeader className="pb-3 border-b bg-white">

                                            <div className="flex justify-between items-start">

                                                <div>

                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Mã đơn hàng
                                                    </span>

                                                    <CardTitle className="text-2xl font-black text-slate-800">
                                                        #{order.orderNumber}
                                                    </CardTitle>

                                                </div>

                                                <Badge
                                                    className={`flex items-center gap-1.5 px-3 py-1 border shadow-sm rounded-xl ${status.color}`}
                                                >
                                                    {status.icon}
                                                    {status.label}
                                                </Badge>

                                            </div>

                                        </CardHeader>

                                        {/* BODY */}
                                        <CardContent className="p-0 bg-white">

                                            {/* ITEMS */}
                                            <div className="p-5 max-h-[400px] overflow-y-auto">

                                                <div className="space-y-4">

                                                    {order.items.map((item: any, index: number) => (

                                                        <div
                                                            key={index}
                                                            className="group flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors"
                                                        >

                                                            {/* IMAGE */}
                                                            <img
                                                                src={
                                                                    item.image ||
                                                                    'https://via.placeholder.com/80'
                                                                }
                                                                className="w-20 h-20 rounded-2xl object-cover border"
                                                                alt={item.productName}
                                                            />

                                                            {/* INFO */}
                                                            <div className="flex-1">

                                                                <div className="flex justify-between gap-3">

                                                                    <div>

                                                                        <p className="font-black text-slate-800 leading-tight">
                                                                            {item.quantity}x {item.productName}
                                                                        </p>

                                                                        {(item.sizeName || item.toppings) && (

                                                                            <div className="mt-1 flex flex-wrap gap-1">

                                                                                {item.sizeName && (
                                                                                    <span className="text-[11px] px-2 py-0.5 bg-white border rounded-md text-slate-500">
                                                                                        Size: {item.sizeName}
                                                                                    </span>
                                                                                )}

                                                                                {item.toppings && (
                                                                                    <span className="text-[11px] px-2 py-0.5 bg-white border rounded-md text-slate-500 italic">
                                                                                        + {item.toppings}
                                                                                    </span>
                                                                                )}

                                                                            </div>

                                                                        )}

                                                                    </div>

                                                                    {/* PRICE */}
                                                                    <div className="text-right">

                                                                        <p className="font-black text-primary text-lg">
                                                                            {item.totalPrice?.toLocaleString()}₫
                                                                        </p>

                                                                        <p className="text-xs text-slate-400">
                                                                            {item.price?.toLocaleString()}₫ / món
                                                                        </p>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>

                                                    ))}

                                                </div>

                                            </div>

                                            {/* NOTE + TOTAL */}
                                            <div className="px-5 pb-4">

                                                {order.note && (

                                                    <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100">

                                                        <p className="text-xs font-bold text-yellow-700 uppercase mb-1">
                                                            Ghi chú cho bếp
                                                        </p>

                                                        <p className="text-sm text-yellow-800">
                                                            {order.note}
                                                        </p>

                                                    </div>

                                                )}

                                                <div className="space-y-3">

                                                    {/* TOTAL */}
                                                    <div className="flex items-center justify-between">

                                                        <span className="text-sm text-slate-500 font-bold">
                                                            Tổng tiền
                                                        </span>

                                                        <span className="text-2xl font-black text-primary">
                                                            {order.totalAmount?.toLocaleString()}₫
                                                        </span>

                                                    </div>

                                                    {/* PAYMENT STATUS */}
                                                    <div className="flex items-center justify-between gap-3">

                                                        {/* PAYMENT STATUS */}
                                                        <div
                                                            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2
                                                                ${order.paymentStatus === 'PAID'
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : 'bg-red-100 text-red-700 border-red-200'
                                                                }`}
                                                        >

                                                            {order.paymentStatus === 'PAID'
                                                                ? <CreditCard className="w-4 h-4" />
                                                                : <Wallet className="w-4 h-4" />
                                                            }

                                                            {order.paymentStatus === 'PAID'
                                                                ? 'Đã thanh toán'
                                                                : 'Chưa thanh toán'
                                                            }

                                                        </div>

                                                        {/* PAYMENT METHOD */}
                                                        <div
                                                            className="px-3 py-2 rounded-xl text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200"
                                                        >

                                                            {order.paymentMethod === 'VNPAY'
                                                                ? 'VNPAY'
                                                                : order.paymentMethod === 'CASH'
                                                                    ? 'Tiền mặt'
                                                                    : '---'
                                                            }

                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                            
                                            {/* PAYMENT ACTION */}
                                            {
                                                order.paymentStatus !== 'PAID' && (

                                                    <div className="px-5 pb-5">

                                                        <div className="grid grid-cols-2 gap-3">

                                                            {/* CASH */}
                                                            <Button
                                                                className="rounded-xl font-bold"
                                                                onClick={() =>
                                                                    continuePayment(
                                                                        order,
                                                                        'cash'
                                                                    )
                                                                }
                                                            >
                                                                <Wallet className="w-4 h-4 mr-2" />
                                                                Tiền mặt
                                                            </Button>

                                                            {/* VNPAY */}
                                                            <Button
                                                                variant="outline"
                                                                className="rounded-xl font-bold"
                                                                onClick={() =>
                                                                    continuePayment(
                                                                        order,
                                                                        'vnpay'
                                                                    )
                                                                }
                                                            >
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                VNPay
                                                            </Button>

                                                        </div>

                                                    </div>

                                                )
                                            }
                                            
                                            {/* FOOTER */}
                                            <div className="p-4 bg-slate-50/50 border-t flex justify-between items-center text-xs text-slate-400">

                                                <div className="flex items-center gap-1">

                                                    <Clock className="w-3 h-3" />

                                                    <span>
                                                        {order.tableId
                                                            ? `Bàn ${order.tableId}`
                                                            : 'Mang về'}
                                                    </span>

                                                </div>

                                                <span className="font-medium uppercase">

                                                    {new Date(order.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}

                                                </span>

                                            </div>

                                        </CardContent>

                                    </Card>

                                );
                            })}

                        </div>

                    )}

                </div>
            </div>

            {/* INTERFACE PAGINATION (Hiển thị khi có nhiều hơn 1 trang) */}
            {totalPages > 1 && (
                <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-500">
                        Hiển thị từ <span className="font-bold text-slate-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> đến{' '}
                        <span className="font-bold text-slate-700">
                            {Math.min(currentPage * ITEMS_PER_PAGE, orders.length)}
                        </span>{' '}
                        trong tổng số <span className="font-bold text-slate-700">{orders.length}</span> đơn hàng
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Nút lùi trang */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-9 h-9 rounded-xl shadow-sm border-slate-200"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Danh sách số trang */}
                        <div className="flex items-center gap-1.5">
                            {pageNumbers.map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? 'default' : 'outline'}
                                    className={`w-9 h-9 p-0 font-bold rounded-xl transition-all ${
                                        currentPage === page
                                            ? 'shadow-md shadow-primary/20 text-white'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        {/* Nút tiến trang */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-9 h-9 rounded-xl shadow-sm border-slate-200"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* SCROLLBAR */}
            <style>{`
                ::-webkit-scrollbar {
                  width: 4px;
                }

                ::-webkit-scrollbar-track {
                  background: transparent;
                }

                ::-webkit-scrollbar-thumb {
                  background: #e2e8f0;
                  border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb:hover {
                  background: #cbd5e1;
                }
            `}</style>

        </div>
    );
}