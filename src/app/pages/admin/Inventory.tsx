import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Plus, Barcode, AlertTriangle, TrendingUp, Package, Loader2, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import ingredientService from '../../../services/ingredientService';

interface Ingredient {
  id?: string | number;
  name: string;
  barcode: string;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  status: boolean;
}

interface ImportRequest {
  id: string | number;
  ingredientId: string | number;
  ingredientName: string;
  quantity: number;
  requestedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string;
}

export function Inventory() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // States dữ liệu
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [importRequests, setImportRequests] = useState<ImportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // States UI
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State phân biệt đang Sửa hay đang Thêm (null là Thêm, có ID là đang Sửa)
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // State Form chung cho cả Thêm và Sửa
  const [formData, setFormData] = useState<Ingredient>({
    name: '',
    barcode: '',
    unit: '',
    stockQuantity: 0,
    minimumStock: 0,
    status: true
  });

  useEffect(() => {
    fetchData();
    if (user.role === "KITCHEN") {
      fetchMyRequests();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await ingredientService.getAll();
      setIngredients(data);
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // Lấy lịch sử yêu cầu dành riêng cho tài khoản KITCHEN hiển thị trực quan
  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await ingredientService.getImportRequests();
      // Lọc ra các yêu cầu được tạo bởi chính tài khoản KITCHEN hiện tại
      const senderName = user.fullName || user.username || "KITCHEN";
      const myRequests = data.filter((item: any) => item.requestedBy === senderName);
      setImportRequests(myRequests);
    } catch (error) {
      console.error("Không thể tải danh sách phản hồi yêu cầu", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleBarcodeScan = () => {
    const ingredient = ingredients.find((ing) => ing.barcode === barcodeInput);
    if (ingredient) {
      toast.success(`Tìm thấy: ${ingredient.name} (Tồn: ${ingredient.stockQuantity} ${ingredient.unit})`);
    } else {
      toast.error('Không tìm thấy nguyên liệu với mã barcode này');
    }
    setBarcodeInput('');
  };

  // Mở form điền sẵn dữ liệu cũ khi bấm nút "Sửa"
  const handleEditClick = (ingredient: Ingredient) => {
    setEditingId(ingredient.id || null);
    setFormData({ ...ingredient });
    setIsAddDialogOpen(true);
  };

  // Kích hoạt khi bấm nút "Thêm nguyên liệu"
  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({ name: '', barcode: '', unit: '', stockQuantity: 0, minimumStock: 0, status: true });
    setIsAddDialogOpen(true);
  };

  // Xử lý Lưu (Cả Thêm mới & Cập nhật)
  const handleSaveIngredient = async () => {
    if (!formData.name || !formData.unit) {
      toast.warning("Vui lòng nhập tên và đơn vị tính");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await ingredientService.update(editingId, formData);
        toast.success("Cập nhật nguyên liệu thành công");
      } else {
        await ingredientService.create(formData);
        toast.success("Thêm nguyên liệu thành công");
      }
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(editingId ? "Lỗi khi cập nhật nguyên liệu" : "Lỗi khi thêm nguyên liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatus = (stock: number, min: number) => {
    const safeMin = min === 0 ? 1 : min;
    const percentage = Math.min((stock / (safeMin * 2)) * 100, 100);

    if (stock <= min) return { label: 'Thiếu hàng', variant: 'destructive' as const, percentage, color: 'bg-red-500' };
    if (stock <= min * 1.5) return { label: 'Sắp hết', variant: 'secondary' as const, percentage, color: 'bg-yellow-500' };
    return { label: 'Đầy đủ', variant: 'default' as const, percentage, color: 'bg-green-500' };
  };

  // Render thẻ trạng thái màu sắc cho danh sách yêu cầu của Bếp
  const renderRequestStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 gap-1"><Clock className="w-3 h-3" /> Đang chờ</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1"><CheckCircle className="w-3 h-3" /> Đã duyệt</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1"><XCircle className="w-3 h-3" /> Đã từ chối</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Đã nhập kho</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý kho & Nguyên liệu</h1>
          <p className="text-gray-500 mt-1">Theo dõi tồn kho thực tế từ hệ thống</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { fetchData(); if (user.role === "KITCHEN") fetchMyRequests(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          {/* Dialog Quét Barcode */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Barcode className="w-4 h-4" />
                Quét Barcode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tìm kiếm bằng Barcode</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 py-4">
                <Input
                  placeholder="Quét hoặc nhập mã..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                  autoFocus
                />
                <Button onClick={handleBarcodeScan}>Tìm</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quản lý Dialog Thêm/Sửa - Dành cho ADMIN */}
          {user.role === "ADMIN" && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleAddNewClick}>
                <Plus className="w-4 h-4" />
                Thêm nguyên liệu
              </Button>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Chỉnh sửa nguyên liệu" : "Tạo nguyên liệu mới"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Tên nguyên liệu</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Sữa tươi Vinamilk"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Mã Barcode</Label>
                      <Input
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="893..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Đơn vị (g, ml, kg...)</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="ml"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Số lượng tồn</Label>
                      <Input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mức tối thiểu</Label>
                      <Input
                        type="number"
                        value={formData.minimumStock}
                        onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                  <Button onClick={handleSaveIngredient} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xác nhận lưu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng loại nguyên liệu</CardTitle>
            <Package className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cảnh báo hết hàng</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {ingredients.filter((i) => i.stockQuantity <= i.minimumStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sắp hết hàng</CardTitle>
            <TrendingUp className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {ingredients.filter((i) => i.stockQuantity > i.minimumStock && i.stockQuantity <= i.minimumStock * 1.5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Inventory */}
      <Card className="shadow-sm border-none">
        <CardHeader className="p-6 bg-white border-b rounded-t-xl">
          <CardTitle className="text-lg font-bold text-slate-800">Danh sách tồn kho vật lý</CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-white rounded-b-xl">
          <Table>
            <TableHeader className="bg-slate-100/50">
              <TableRow>
                <TableHead className="font-bold">Tên nguyên liệu</TableHead>
                <TableHead className="font-bold">Barcode</TableHead>
                <TableHead className="font-bold">Tồn kho hiện tại</TableHead>
                <TableHead className="font-bold">Ngưỡng tối thiểu</TableHead>
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
              ) : ingredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    Chưa có nguyên liệu nào trong kho
                  </TableCell>
                </TableRow>
              ) : (
                ingredients.map((ingredient) => {
                  const status = getStockStatus(ingredient.stockQuantity, ingredient.minimumStock);
                  const canRequest = ingredient.stockQuantity <= ingredient.minimumStock * 1.5;

                  return (
                    <TableRow key={ingredient.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-700">{ingredient.name}</TableCell>
                      <TableCell>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                          {ingredient.barcode || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{ingredient.stockQuantity} {ingredient.unit}</span>
                            <span className="text-slate-400">{(status.percentage).toFixed(0)}%</span>
                          </div>
                          <Progress value={status.percentage} className={`h-1.5`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {ingredient.minimumStock} {ingredient.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="shadow-none">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Hành động sửa / xóa cho ADMIN */}
                        {user.role === "ADMIN" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-600"
                              onClick={() => handleEditClick(ingredient)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={async () => {
                                if (!window.confirm(`Xóa ${ingredient.name}?`)) return;
                                try {
                                  await ingredientService.delete(Number(ingredient.id));
                                  toast.success("Xóa thành công");
                                  fetchData();
                                } catch {
                                  toast.error("Xóa thất bại");
                                }
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        )}

                        {/* Hành động cho KITCHEN - ĐÃ SỬA: Gửi người dùng thật */}
                        {user.role === "KITCHEN" && canRequest && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-5"
                            onClick={async () => {
                              const request = {
                                ingredientId: ingredient.id,
                                quantity: ingredient.minimumStock,
                                // SỬA: Thay chữ "KITCHEN" cứng bằng tên thật của tài khoản đang đăng nhập
                                requestedBy: user.fullName || user.username || "KITCHEN",
                                note: `Yêu cầu nhập ${ingredient.name}`
                              };

                              try {
                                await ingredientService.requestImport(request);
                                toast.success("Đã gửi yêu cầu nhập kho thành công!");
                                fetchMyRequests(); // Cập nhật ngay bảng theo dõi ở dưới
                              } catch {
                                toast.error("Gửi yêu cầu thất bại");
                              }
                            }}
                          >
                            Yêu cầu nhập
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MÀN HÌNH THEO DÕI THÔNG BÁO CHO KITCHEN (CHỈ HIỂN THỊ KHI ROLE LÀ KITCHEN) */}
      {user.role === "KITCHEN" && (
        <Card className="shadow-sm border-none mt-6">
          <CardHeader className="p-6 bg-white border-b flex flex-row items-center justify-between rounded-t-xl">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Trạng thái phản hồi từ Admin</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Theo dõi kết quả phê duyệt các đơn đề xuất nhập hàng của bạn</p>
            </div>
            <Button size="sm" variant="ghost" className="text-indigo-600" onClick={fetchMyRequests}>
              Tải lại bảng
            </Button>
          </CardHeader>
          <CardContent className="p-0 bg-white rounded-b-xl">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-bold">Mã YC</TableHead>
                  <TableHead className="font-bold">Nội dung đề xuất</TableHead>
                  <TableHead className="font-bold">Số lượng gửi</TableHead>
                  <TableHead className="font-bold">Người gửi yêu cầu</TableHead>
                  <TableHead className="font-bold">Trạng thái phê duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRequests ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-xs text-gray-500">
                      Đang kiểm tra dữ liệu phản hồi...
                    </TableCell>
                  </TableRow>
                ) : importRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-400 text-sm italic">
                      Bạn chưa gửi yêu cầu nhập kho nào gần đây.
                    </TableCell>
                  </TableRow>
                ) : (
                  importRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-400 font-medium text-xs">#{req.id}</TableCell>
                      <TableCell className="font-medium text-slate-700">
                        Yêu cầu nhập {req.ingredientName}
                      </TableCell>                      <TableCell className="font-bold text-slate-800">{req.quantity}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal text-xs">{req.requestedBy}</Badge></TableCell>
                      <TableCell>{renderRequestStatus(req.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}