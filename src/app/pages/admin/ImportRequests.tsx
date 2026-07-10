import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import ingredientService from '../../../services/ingredientService';

interface ImportRequest {
    id: string | number;
    ingredientId: string | number;
    quantity: number;
    requestedBy: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    note: string;
    createdAt?: string;
    ingredientName?: string; // Tên nguyên liệu nếu backend có trả kèm, hoặc map từ id
}

export function ImportRequests() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [requests, setRequests] = useState<ImportRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await ingredientService.getImportRequests();
            setRequests(data);
        } catch (error) {
            toast.error("Không thể tải danh sách yêu cầu nhập kho");
        } finally {
            setLoading(false);
        }
    };
    const handleReject = async (
        id: string | number
    ) => {

        try {

            await ingredientService
                .rejectRequest(id);

            toast.success(
                "Đã từ chối yêu cầu"
            );

            fetchData();

        } catch {

            toast.error(
                "Từ chối thất bại"
            );

        }

    };

    const handleApprove = async (
        request: ImportRequest
    ) => {

        try {

            await ingredientService.approveRequest(
                request.id
            );

            toast.success(
                "Đã duyệt yêu cầu"
            );

            fetchData();

        } catch {

            toast.error(
                "Duyệt thất bại"
            );

        }
    };
    const handleReceiveImport = async (
        request: ImportRequest
    ) => {

        const quantity = Number(
            prompt(
                "Nhập số lượng thực tế:",
                request.quantity.toString()
            )
        );

        if (!quantity) return;

        try {

            await ingredientService.receiveImport(
                Number(request.id),
                quantity
            );

            toast.success(
                "Đã nhập kho thành công"
            );

            fetchData();

        } catch {

            toast.error(
                "Nhập kho thất bại"
            );

        }
    };
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Đang chờ</Badge>;
            case "APPROVED":
                return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Đã duyệt</Badge>;
            case "REJECTED":
                return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Đã từ chối</Badge>;
            case "COMPLETED":
                return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100"> Đã nhập kho</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Yêu cầu nhập kho từ bếp</h1>
                    <p className="text-gray-500 mt-1">Phê duyệt hoặc từ chối các đề xuất mua thêm nguyên liệu</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            <Card className="shadow-sm border-none">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow>
                                <TableHead className="font-bold">Mã YC</TableHead>
                                <TableHead className="font-bold">Ghi chú / Nguyên liệu</TableHead>
                                <TableHead className="font-bold">Số lượng đề xuất</TableHead>
                                <TableHead className="font-bold">Người yêu cầu</TableHead>
                                <TableHead className="font-bold">Trạng thái</TableHead>
                                <TableHead className="text-right font-bold">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="animate-spin inline-block mr-2" /> Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        Không có yêu cầu nhập kho nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-medium text-slate-500">#{req.id}</TableCell>
                                        <TableCell className="font-semibold text-slate-700">{req.note}</TableCell>
                                        <TableCell className="text-slate-900 font-medium">{req.quantity}</TableCell>
                                        <TableCell><Badge variant="outline">{req.requestedBy}</Badge></TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {/* CHỈ ADMIN MỚI ĐƯỢC PHÉP THAO TÁC DUYỆT / TỪ CHỐI / NHẬP KHO */}
                                            {user.role === "ADMIN" ? (
                                                req.status === "PENDING" ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleApprove(req)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Duyệt
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-200"
                                                            onClick={() => handleReject(req.id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Từ chối
                                                        </Button>
                                                    </div>
                                                ) : req.status === "APPROVED" ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handleReceiveImport(req)}
                                                    >
                                                        Nhập kho
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                                                )
                                            ) : (
                                                /* NẾU LÀ KITCHEN HOẶC ROLE KHÁC: Chỉ hiển thị dòng chữ thông báo xem, không cho bấm */
                                                <span className="text-xs text-gray-400 italic">Chỉ xem</span>
                                            )}
                                        </TableCell>                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}