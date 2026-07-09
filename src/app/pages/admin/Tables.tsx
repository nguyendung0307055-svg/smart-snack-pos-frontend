import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  QrCode,
  Loader2,
  RefreshCcw,
  Plus,
  Trash2,
  Copy,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';

// Services
import tableService from '../../../services/tableService';

// Components
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
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

interface TableItem {
  id: number;
  tableNumber: string;
  status: string;
  qrCodeUrl: string;
}

export function Tables() {
  // --- States ---
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Dialog States
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<TableItem | null>(null);
  
  // Form State
  const [tableNumber, setTableNumber] = useState('');

  // =========================
  // FETCH DATA
  // =========================
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAll();
      setTables(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Không tải được danh sách bàn từ server Java');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // =========================
  // CREATE TABLE
  // =========================
  const createTable = async () => {
    if (!tableNumber.trim()) {
      return toast.error('Vui lòng nhập tên hoặc số bàn');
    }

    const loadingToast = toast.loading('Đang khởi tạo bàn...');
    try {
      await tableService.create({ tableNumber });
      toast.success('Tạo bàn thành công', { id: loadingToast });
      setTableNumber('');
      setOpenCreate(false);
      fetchTables();
    } catch (error) {
      console.error(error);
      toast.error('Tạo bàn thất bại', { id: loadingToast });
    }
  };

  // =========================
  // DELETE TABLE
  // =========================
  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    const loadingToast = toast.loading('Đang xóa bàn...');
    try {
      await tableService.delete(tableToDelete.id);
      toast.success(`Đã xóa vĩnh viễn ${tableToDelete.tableNumber}`, { id: loadingToast });
      setTableToDelete(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      toast.error('Xóa bàn thất bại', { id: loadingToast });
    }
  };

  // =========================
  // CLEAN TABLE
  // =========================
  const cleanTable = async (id: number) => {
    const loadingToast = toast.loading('Đang cập nhật trạng thái dọn bàn...');
    try {
      await tableService.cleanTable(id);
      toast.success('Đã dọn bàn và đưa về trạng thái trống', { id: loadingToast });
      fetchTables();
    } catch (error) {
      console.error(error);
      toast.error('Dọn bàn thất bại', { id: loadingToast });
    }
  };

  // =========================
  // DYNAMIC CARD & BADGE STYLES
  // =========================
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:border-emerald-300';
      case 'OCCUPIED':
        return 'bg-rose-50 text-rose-700 border-rose-200/60 hover:border-rose-300';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 hover:border-amber-300';
      case 'DIRTY':
        return 'bg-slate-100 text-slate-600 border-slate-300/60 hover:border-slate-400';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300';
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-emerald-100/80 text-emerald-700 border-none';
      case 'OCCUPIED':
        return 'bg-rose-100/80 text-rose-700 border-none';
      case 'RESERVED':
        return 'bg-amber-100/80 text-amber-700 border-none';
      case 'DIRTY':
        return 'bg-slate-200 text-slate-700 border-none';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  // =========================
  // STATUS TRANSLATION
  // =========================
  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'Trống';
      case 'OCCUPIED':
        return 'Đang sử dụng';
      case 'RESERVED':
        return 'Đã đặt trước';
      case 'DIRTY':
        return 'Chưa dọn dẹp';
      default:
        return status || 'Không rõ';
    }
  };

  // =========================
  // UTILS
  // =========================
  const copyQrLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã copy đường dẫn QR Code vào bộ nhớ tạm');
    } catch {
      toast.error('Không thể truy cập bộ nhớ tạm để copy');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-indigo-600" />
            Quản lý Sơ đồ bàn
          </h1>
          <p className="text-slate-500 font-medium italic">Hệ thống Smart POS v1.0</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl" 
            onClick={fetchTables}
          >
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </Button>

          <Button 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl w-full sm:w-auto" 
            onClick={() => setOpenCreate(true)}
          >
            <Plus className="w-4 h-4" />
            Thêm bàn mới
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white border rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-medium">Đang đồng bộ dữ liệu bàn ăn...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
          <UtensilsCrossed className="w-16 h-16 mb-3 stroke-1 text-slate-300" />
          <p className="font-medium text-slate-500">Chưa có bàn ăn nào trong hệ thống</p>
          <Button variant="link" className="text-indigo-600 mt-1 font-semibold" onClick={() => setOpenCreate(true)}>
            Nhấp vào đây để thêm bàn đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`border-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white ${getStatusColor(table.status)}`}
            >
              <CardContent className="p-6 text-center flex flex-col items-center h-full">
                {/* STATUS BADGE */}
                <Badge className={`mb-3 border px-3 py-0.5 rounded-full font-bold text-xs tracking-wide ${getBadgeStyle(table.status)}`}>
                  {getStatusLabel(table.status)}
                </Badge>

                {/* TABLE NUMBER */}
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">
                  {table.tableNumber}
                </h2>

                {/* QR CODE PREVIEW */}
                <div className="mb-6 bg-white p-3 rounded-xl border border-slate-100 shadow-inner group relative cursor-pointer" onClick={() => setSelectedQr(table.qrCodeUrl)}>
                  <QRCode value={table.qrCodeUrl || 'https://smartpos.menu'} size={120} />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <QrCode className="text-white w-6 h-6" />
                  </div>
                </div>

                {/* ACTION BUTTONS GROUP */}
                <div className="w-full mt-auto space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl gap-1.5 font-bold text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      onClick={() => setSelectedQr(table.qrCodeUrl)}
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      Xem QR
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl gap-1.5 font-bold text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      onClick={() => copyQrLink(table.qrCodeUrl)}
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copy Link
                    </Button>
                  </div>

                  {/* Nút Dọn Bàn: Xuất hiện khi không phải trạng thái AVAILABLE */}
                  {table.status?.toUpperCase() !== 'AVAILABLE' && (
                    <Button
                      size="sm"
                      className="w-full rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md shadow-emerald-100 transition-all"
                      onClick={() => cleanTable(table.id)}
                    >
                      🧹 Dọn dẹp bàn ăn
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full rounded-xl gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold"
                    onClick={() => setTableToDelete(table)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa bàn
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DIALOG: CREATE NEW TABLE */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-indigo-600 p-6 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Plus className="w-5 h-5" />
              Thêm bàn phục vụ mới
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên / Ký hiệu số bàn *</Label>
              <Input
                placeholder="Ví dụ: Bàn 01, Khu A - Bàn 02..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" className="rounded-xl" onClick={() => setOpenCreate(false)}>Hủy</Button>
            <Button onClick={createTable} className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-xl shadow-md">
              Xác nhận tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: FULLSIZE QR CODE */}
      <Dialog open={!!selectedQr} onOpenChange={() => setSelectedQr(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-indigo-600 p-6 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <QrCode className="w-5 h-5" />
              QR Code Đặt Món Tại Bàn
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 bg-white gap-4">
            {selectedQr ? (
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md">
                  <QRCode value={selectedQr} size={240} />
                </div>
                <p className="text-xs text-slate-400 font-medium text-center max-w-[280px]">
                  Khách hàng có thể quét mã QR này bằng thiết bị di động để xem thực đơn trực tuyến và tiến hành gọi món.
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Không tìm thấy mã QR</p>
            )}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6" onClick={() => setSelectedQr(null)}>
              Đóng lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: CONFIRM DELETE */}
      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold">Xác nhận xóa bàn ăn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn không thể khôi phục <b className="text-red-500">{tableToDelete?.tableNumber}</b> cùng các dữ liệu liên kết cấu hình QR khỏi phân hệ Smart POS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
              Xác nhận xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}