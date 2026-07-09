import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Trash2, Utensils, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import productService from '../../../services/productService';
import ingredientService from '../../../services/ingredientService';
import recipeService from '../../../services/recipeService';
import { Label } from '../../components/ui/label';

export function Recipes() {
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Form state cho dòng công thức mới
  const [newRecipe, setNewRecipe] = useState({
    ingredientId: "",
    quantity: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [prodData, ingData] = await Promise.all([
        productService.getAll(),
        ingredientService.getAll()
      ]);
      setProducts(prodData);
      setIngredients(ingData);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu");
    }
  };

  const loadRecipesByProduct = async (productId: string) => {
    setLoading(true);
    try {
      // Giả sử API trả về các RecipeResponse như bạn định nghĩa ở Java
      const data = await recipeService.getAll(); 
      // Lọc recipe theo sản phẩm (Client-side filter hoặc dùng API getByProduct)
      const filtered = data.filter((r: any) => r.productName === products.find(p => p.id == productId)?.name);
      setRecipes(filtered);
    } catch (error) {
      toast.error("Lỗi tải công thức");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedProduct || !newRecipe.ingredientId || newRecipe.quantity <= 0) {
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      await recipeService.create({
        productId: Number(selectedProduct),
        ingredientId: Number(newRecipe.ingredientId),
        quantity: newRecipe.quantity
      });
      toast.success("Đã thêm nguyên liệu vào công thức");
      loadRecipesByProduct(selectedProduct);
    } catch (error) {
      toast.error("Lỗi khi lưu định mức");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Utensils className="text-orange-500" /> Định mức nguyên liệu (Recipe)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Chọn sản phẩm */}
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Chọn sản phẩm</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={(val) => {
                setSelectedProduct(val);
                loadRecipesByProduct(val);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn món ăn/đồ uống" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 italic">
              * Chọn một sản phẩm để thiết lập các nguyên liệu thành phần.
            </p>
          </CardContent>
        </Card>

        {/* Cột phải: Danh sách nguyên liệu trong công thức */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thành phần công thức</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 items-end border-b pb-6">
              <div className="flex-1 space-y-2">
                <Label>Nguyên liệu</Label>
                <Select onValueChange={(val) => setNewRecipe({...newRecipe, ingredientId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nguyên liệu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id.toString()}>{ing.name} ({ing.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32 space-y-2">
                <Label>Số lượng</Label>
                <Input 
                  type="number" 
                  value={newRecipe.quantity} 
                  onChange={(e) => setNewRecipe({...newRecipe, quantity: Number(e.target.value)})}
                />
              </div>
              <Button onClick={handleAddIngredient} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-1" /> Thêm
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nguyên liệu</TableHead>
                  <TableHead>Định mức (Số lượng)</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/> Đang tải...</TableCell></TableRow>
                ) : recipes.length > 0 ? (
                  recipes.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.ingredientName}</TableCell>
                      <TableCell>{r.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-10">Chưa có công thức cho sản phẩm này</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}