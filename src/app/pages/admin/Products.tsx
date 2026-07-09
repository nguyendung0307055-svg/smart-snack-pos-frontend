import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  PackageSearch,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { toast } from "sonner";

// Services
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";

export function Products() {
  // --- States ---
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Phân trang States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Mặc định hiển thị 5 món / trang

  // Dialog & Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  // Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialForm = {
    name: "",
    description: "",
    image: "",
    price: "",
    status: true,
    bestSeller: false,
    categoryId: ""
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);

  // Reset về trang 1 mỗi khi người dùng tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (error) {
      toast.error("Không thể kết nối đến server Java");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setIsUploading(true);
    try {
      const response = await productService.uploadImage(file);
      const remoteUrl = response.url; 
      
      setFormData(prev => ({ ...prev, image: remoteUrl }));
      toast.success("Tải ảnh lên thành công");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Lỗi tải ảnh lên server");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        image: product.image || "",
        price: product.price.toString(),
        status: product.status,
        bestSeller: product.bestSeller || false,
        categoryId: product.categoryId?.toString() || ""
      });
      setImagePreview(product.image || null);
    } else {
      setEditingProduct(null);
      setFormData(initialForm);
      setImagePreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const loadingToast = toast.loading(editingProduct ? "Đang cập nhật..." : "Đang tạo mới...");

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        categoryId: Number(formData.categoryId)
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        toast.success("Cập nhật thành công", { id: loadingToast });
      } else {
        await productService.create(payload);
        toast.success("Thêm sản phẩm thành công", { id: loadingToast });
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Thao tác thất bại", { id: loadingToast });
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.delete(productToDelete.id);
      toast.success("Đã xóa sản phẩm");
      setIsDeleteAlertOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  // --- Logic Phân trang & Tìm kiếm ---
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Tính toán vị trí phần tử đầu và cuối của trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Tạo mảng số trang hiển thị (Ví dụ: [1, 2, 3])
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PackageSearch className="w-8 h-8 text-indigo-600" />
            Quản lý Sản phẩm
          </h1>
          <p className="text-slate-500 font-medium italic">Hệ thống Smart POS v1.0</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Thêm món mới
        </Button>
      </div>

      {/* Danh sách Table Card */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-slate-700">
              Danh sách món ăn ({totalItems})
            </CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm sản phẩm..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="text-slate-400">Đang tải dữ liệu từ Backend Java...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <PackageSearch className="w-12 h-12 mb-2 stroke-1" />
              <p>Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Ảnh</TableHead>
                    <TableHead>Tên & Mô tả</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((product) => (
                    <TableRow key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mx-auto flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} className="h-full w-full object-cover" alt={product.name} />
                          ) : (
                            <ImageIcon className="h-6 h-6 text-slate-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[240px]">
                          <span className="font-bold text-slate-700 truncate">{product.name}</span>
                          <span className="text-xs text-slate-400 line-clamp-1">{product.description || "Chưa có mô tả"}</span>
                          {product.bestSeller && (
                            <Badge className="w-fit scale-90 -ml-1 mt-0.5 bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-50 font-semibold">
                              Bán chạy
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium border-none">
                          {product.categoryName || 'Chưa phân loại'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-indigo-600">
                        {Number(product.price).toLocaleString()}₫
                      </TableCell>
                      <TableCell>
                        <Badge className={product.status ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50" : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-50"}>
                          {product.status ? "Đang bán" : "Tạm ngưng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="hover:bg-indigo-50 group/btn" onClick={() => handleOpenModal(product)}>
                            <Edit className="h-4 w-4 text-indigo-600 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-red-50 group/btn" onClick={() => { setProductToDelete(product); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-red-500 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* THANH PHÂN TRANG (PAGINATION BAR) */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-white gap-4">
                {/* Text thông tin vị trí dữ liệu */}
                <div className="text-sm text-slate-500 font-medium">
                  Hiển thị từ <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : indexOfFirstItem + 1}</span> đến{" "}
                  <span className="font-semibold text-slate-700">{Math.min(indexOfLastItem, totalItems)}</span> trong tổng số{" "}
                  <span className="font-semibold text-slate-700">{totalItems}</span> món ăn
                </div>

                <div className="flex items-center gap-6">
                  {/* Cấu hình số dòng trên mỗi trang */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Số hàng:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="h-8 w-[70px] bg-slate-50 border-slate-200 rounded-lg">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nút điều hướng phân trang */}
                  <div className="flex items-center gap-1.5">
                    {/* Về trang đầu */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Về trang trước */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Danh sách số trang cụ thể */}
                    {pageNumbers.map((number) => {
                      // Logic rút gọn hiển thị nếu quá nhiều trang (tùy chọn, ở đây render đủ)
                      return (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          className={`h-8 w-8 p-0 rounded-lg text-sm font-semibold transition-all ${
                            currentPage === number
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                          onClick={() => setCurrentPage(number)}
                        >
                          {number}
                        </Button>
                      );
                    })}

                    {/* Sang trang kế tiếp */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Đến trang cuối */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DIALOG: CREATE & UPDATE */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-indigo-600 p-6 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <span className="flex items-center gap-2">
                {editingProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </span>
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm mới sản phẩm"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white">
            {/* Cột Trái: Upload Ảnh */}
            <div className="space-y-3">
              <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Hình ảnh hiển thị</Label>
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white w-8 h-8" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />}
                    <p className="text-[10px] mt-2 text-slate-400 font-medium uppercase">Tải ảnh lên</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              {imagePreview && (
                <Button variant="outline" size="sm" className="w-full text-red-500 border-red-100 hover:bg-red-50 rounded-xl" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: "" }) }}>
                  Xóa ảnh
                </Button>
              )}
            </div>

            {/* Cột Phải: Form Thông tin */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên sản phẩm *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Trà đào Cam Sả" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục *</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Giá bán (VNĐ) *</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="35000" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 mt-auto h-[40px]">
                  <Label className="text-xs font-bold text-orange-600">Bán chạy?</Label>
                  <Switch checked={formData.bestSeller} onCheckedChange={(c) => setFormData({ ...formData, bestSeller: c })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả ngắn</Label>
                <div className="relative">
                  <Textarea className="min-h-[80px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Nguyên liệu, hương vị..." />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border-l-4 border-l-emerald-500 bg-emerald-50/50 rounded-r-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-800">Kinh doanh</span>
                  <span className="text-[10px] text-emerald-600">Hiển thị món này trên thực đơn</span>
                </div>
                <Switch checked={formData.status} onCheckedChange={(c) => setFormData({ ...formData, status: c })} />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSaveProduct}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 px-10 rounded-xl"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý ảnh...
                </>
              ) : (editingProduct ? "Cập nhật ngay" : "Tạo sản phẩm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT: DELETE */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn <b className="text-red-500">{productToDelete?.name}</b> khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Bỏ qua</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 rounded-xl">Xác nhận xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}