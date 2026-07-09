import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch'; // Đảm bảo bạn đã cài shadcn switch
import {
    Plus,
    Pencil,
    Trash2,
    Image as ImageIcon,
    Upload,
    Search,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import toppingService from '../../../services/toppingService';

// 1. Cập nhật Interface khớp với Entity Backend
interface Topping {
    id: number;
    name: string;
    price: number;
    image: string;
    status: boolean; // Đã thêm status
}

export default function Topping() {
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
    
    // 2. formData cần chứa status để gửi lên Backend không bị lỗi 500
    const [formData, setFormData] = useState({ 
        name: '', 
        price: 0, 
        image: '', 
        status: true 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchToppings = async () => {
        try {
            setLoading(true);
            const data = await toppingService.getAll();
            setToppings(data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách topping");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchToppings();
    }, []);

    const handleOpenModal = (topping?: Topping) => {
        if (topping) {
            setEditingTopping(topping);
            setFormData({ 
                name: topping.name, 
                price: topping.price, 
                image: topping.image,
                status: topping.status // Lấy status hiện tại
            });
        } else {
            setEditingTopping(null);
            setFormData({ name: '', price: 0, image: '', status: true });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Backend nhận Max 10MB nhưng nên check 2MB ở FE để trải nghiệm mượt hơn
            if (file.size > 2 * 1024 * 1024) {
                return toast.error("Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB");
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
                toast.success("Đã chọn ảnh");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || formData.price < 0) {
            return toast.warning("Vui lòng nhập đầy đủ tên và giá hợp lệ");
        }

        try {
            setIsSubmitting(true);
            if (editingTopping) {
                // Gửi PUT với đầy đủ các trường bao gồm status
                await toppingService.update(editingTopping.id, formData);
                toast.success("Cập nhật topping thành công");
            } else {
                await toppingService.create(formData);
                toast.success("Thêm topping mới thành công");
            }
            fetchToppings();
            setIsModalOpen(false);
        } catch (error) {
            // Nếu vẫn lỗi 500, Dung hãy kiểm tra console của IntelliJ nhé
            toast.error("Lưu thất bại. Vui lòng kiểm tra dữ liệu Backend");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa topping này?")) {
            try {
                await toppingService.delete(id);
                toast.success("Đã xóa topping");
                fetchToppings();
            } catch (error) {
                toast.error("Xóa thất bại");
            }
        }
    };

    const filteredToppings = toppings.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Topping</h1>
                    <p className="text-gray-500 text-sm">Quản lý danh sách và trạng thái kinh doanh của topping</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Thêm Topping
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-white rounded-t-xl">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Tìm kiếm topping..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="w-24">Hình ảnh</TableHead>
                                <TableHead>Tên Topping</TableHead>
                                <TableHead>Giá (VNĐ)</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                                        Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                            ) : filteredToppings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-gray-400">
                                        Không tìm thấy topping nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredToppings.map((topping) => (
                                    <TableRow key={topping.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white">
                                                {topping.image ? (
                                                    <img src={topping.image} alt={topping.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-700">{topping.name}</TableCell>
                                        <TableCell>
                                            <span className="text-blue-600 font-bold">
                                                {topping.price.toLocaleString()}₫
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {topping.status ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Đang bán</Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none">Ngừng bán</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(topping)} className="text-blue-600 hover:bg-blue-50">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(topping.id)} className="text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Thêm/Sửa */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">
                            {editingTopping ? 'Cập nhật Topping' : 'Thêm Topping mới'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-5 py-4">
                        {/* Upload ảnh */}
                        <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed rounded-2xl bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30 transition-all relative group cursor-pointer">
                            <input
                                type="file"
                                id="topping-image"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <label htmlFor="topping-image" className="w-full flex flex-col items-center cursor-pointer">
                                {formData.image ? (
                                    <div className="relative w-32 h-32">
                                        <img src={formData.image} className="w-full h-full object-cover rounded-xl shadow-md border-2 border-white" />
                                        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-white flex flex-col items-center justify-center text-gray-400 gap-2 border shadow-sm">
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                <span className="mt-2 text-sm font-medium text-blue-600">
                                    {formData.image ? "Thay đổi ảnh" : "Tải ảnh lên"}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-1">Dung lượng tối đa 2MB</p>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Tên Topping</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ví dụ: Trân châu trắng"
                                    className="focus-visible:ring-blue-500"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Giá cộng thêm (VNĐ)</label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    placeholder="5000"
                                    className="focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Trường Trạng thái - Quan trọng để không lỗi Backend */}
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-gray-700">Trạng thái kinh doanh</label>
                                    <p className="text-xs text-gray-500">Cho phép khách hàng chọn topping này</p>
                                </div>
                                <Switch 
                                    checked={formData.status}
                                    onCheckedChange={(checked) => setFormData({...formData, status: checked})}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-lg">
                            Hủy
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting} 
                            className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                editingTopping ? 'Cập nhật ngay' : 'Thêm mới'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}