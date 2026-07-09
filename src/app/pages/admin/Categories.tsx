import React, { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { ScrollArea } from "../../components/ui/scroll-area";
import { 
    Plus, Search, Edit, Trash2, 
    Image as ImageIcon, Loader2, Layers, 
    Upload, Info, Package 
} from "lucide-react";
import { toast } from "sonner";

import categoryService from "../../../services/categoryService";
import productService from "../../../services/productService";

export function Categories() {
    // --- States cho Danh mục ---
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

    // --- States cho Hình ảnh ---
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- States cho Xem chi tiết sản phẩm ---
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
    const [productsInCategory, setProductsInCategory] = useState<any[]>([]);
    const [viewingCategory, setViewingCategory] = useState<any>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const initialForm = { name: "", image: "", status: true };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            toast.error("Lỗi tải danh mục");
        } finally { setLoading(false); }
    };

    // --- Xử lý Hình ảnh ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setIsUploading(true);
        try {
            const response = await productService.uploadImage(file);
            setFormData(prev => ({ ...prev, image: response.url }));
            toast.success("Tải ảnh lên thành công");
        } catch (error) {
            toast.error("Lỗi tải ảnh");
            setImagePreview(null);
        } finally { setIsUploading(false); }
    };

    // --- Xử lý CRUD Danh mục ---
    const handleOpenModal = (category: any = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, image: category.image || "", status: category.status });
            setImagePreview(category.image || null);
        } else {
            setEditingCategory(null);
            setFormData(initialForm);
            setImagePreview(null);
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return toast.warning("Tên danh mục không được để trống");
        try {
            if (editingCategory) {
                await categoryService.update(editingCategory.id, formData);
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await categoryService.create(formData);
                toast.success("Thêm danh mục mới thành công!");
            }
            setIsDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };

    const handleDelete = async () => {
        try {
            await categoryService.delete(categoryToDelete.id);
            toast.success("Đã xóa danh mục");
            setIsDeleteAlertOpen(false);
            fetchCategories();
        } catch (error) { toast.error("Không thể xóa danh mục"); }
    };

    // --- Xử lý Xem chi tiết sản phẩm ---
    const handleViewDetails = async (category: any) => {
        setViewingCategory(category);
        setIsViewDetailsOpen(true);
        setLoadingProducts(true);
        try {
            const data = await categoryService.getProductsByCategory(category.id);
            setProductsInCategory(data);
        } catch (error) {
            toast.error("Không thể tải danh sách sản phẩm");
            setProductsInCategory([]);
        } finally { setLoadingProducts(false); }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-indigo-600" /> Quản lý Danh mục
                    </h1>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-5 w-5" /> Thêm danh mục
                </Button>
            </div>

            <Card className="shadow-sm border-none">
                <CardHeader className="bg-white rounded-t-xl border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Danh sách ({categories.length})</CardTitle>
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm danh mục..."
                                className="pl-10"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-xl">
                    {loading ? (
                        <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="w-[100px]">Ảnh</TableHead>
                                    <TableHead>Tên danh mục</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cat) => (
                                    <TableRow key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell>
                                            <div className="h-10 w-10 rounded-lg border overflow-hidden bg-slate-100 shadow-sm">
                                                {cat.image ? <img src={cat.image} className="h-full w-full object-cover" /> : <ImageIcon className="p-2 text-slate-300" />}
                                            </div>
                                        </TableCell>
                                        <TableCell 
                                            className="font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition-all group"
                                            onClick={() => handleViewDetails(cat)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {cat.name}
                                                <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cat.status ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                                                {cat.status ? "Hoạt động" : "Ẩn"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)}><Edit className="h-4 w-4 text-indigo-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setCategoryToDelete(cat); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* --- Dialog Form Thêm/Sửa --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle className="text-xl">{editingCategory ? "Cập nhật" : "Thêm mới"} danh mục</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-3">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-50 overflow-hidden transition-all border-slate-200 hover:border-indigo-400 group relative"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="text-slate-300 w-8 h-8 group-hover:text-indigo-400" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-indigo-600" />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ảnh đại diện</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Tên danh mục</Label>
                            <Input id="cat-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Đồ uống, Thức ăn nhanh..." />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                            <div className="space-y-0.5">
                                <Label>Trạng thái hiển thị</Label>
                                <p className="text-xs text-slate-500">Cho phép danh mục xuất hiện trên menu</p>
                            </div>
                            <Switch checked={formData.status} onCheckedChange={(c) => setFormData({ ...formData, status: c })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSave} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700 px-8">Lưu lại</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Dialog Xem Chi Tiết Sản Phẩm --- */}
            <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Package className="w-6 h-6 text-indigo-600" />
                            Sản phẩm thuộc: {viewingCategory?.name}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[400px] w-full p-6">
                        {loadingProducts ? (
                            <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
                                <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                                <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
                            </div>
                        ) : productsInCategory.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {productsInCategory.map((prod) => (
                                    <div key={prod.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-lg bg-white border overflow-hidden shadow-sm">
                                                {prod.image ? (
                                                    <img src={prod.image} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="p-3 text-slate-200" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{prod.name}</p>
                                                <p className="text-sm font-semibold text-indigo-600">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={prod.status ? "default" : "secondary"} className={prod.status ? "bg-indigo-100 text-indigo-700 border-none shadow-none" : ""}>
                                            {prod.status ? "Đang bán" : "Ngừng bán"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                                <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-300">
                                    <Package className="w-12 h-12" />
                                </div>
                                <p className="font-medium text-slate-500">Chưa có sản phẩm nào!</p>
                                <p className="text-xs">Hãy thêm sản phẩm vào danh mục này để hiển thị.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-4 border-t bg-slate-50 flex justify-end px-6">
                        <Button onClick={() => setIsViewDetailsOpen(false)} variant="secondary">Đóng</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- Alert Xóa --- */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Xác nhận xóa danh mục?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tất cả thông tin về danh mục <b>{categoryToDelete?.name}</b> sẽ bị xóa khỏi hệ thống. Các sản phẩm thuộc danh mục này có thể gặp lỗi hiển thị.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Xác nhận xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}