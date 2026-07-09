import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Package, 
  Loader2, 
  FileSpreadsheet, 
  Layers,
  Calendar,
  Users,
  Layers3,
  BarChart3,
  Trophy
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import orderService from '../../../services/orderService';
import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import ingredientService from '../../../services/ingredientService';
import * as XLSX from 'xlsx';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrdersCount: 0,
    processingOrdersCount: 0,
    topProductSold: 0,
    topProductName: 'Chưa có',
  });

  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [weeklyBarData, setWeeklyBarData] = useState<any[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<any[]>([]);
  const [realIngredients, setRealIngredients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const COLORS = ['#4318FF', '#6AD2FF', '#EFF4FB', '#10B981', '#F59E0B'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [ordersRes, productsRes, categoriesRes, ingredientsData] = await Promise.all([
          orderService.getAllOrders(),
          productService.getAll(),
          categoryService.getAll(),
          ingredientService.getAll() 
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes || [];
        const categories = categoriesRes || [];
        const ingredients = ingredientsData || []; 

        const todayStr = new Date().toLocaleDateString('vi-VN');

        let todayRev = 0;
        let todayOrders = 0;
        let processingOrders = 0;
        const productSalesMap: { [key: number]: { name: string; sold: number; revenue: number } } = {};
        
        const revenueByMonth: { [key: string]: number } = {};
        const revenueByFullDate: { [key: string]: { timestamp: number; display: string; amount: number } } = {};

        orders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt || order.orderDate);
          const fullDateStr = orderDate.toLocaleDateString('vi-VN');
          
          const monthStr = `Th ${orderDate.getMonth() + 1}`; 
          
          const day = String(orderDate.getDate()).padStart(2, '0');
          const month = String(orderDate.getMonth() + 1).padStart(2, '0');
          const dateKey = `${day}/${month}`;

          const dayTimestamp = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();

          if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
            processingOrders++;
          }

          if (order.paymentStatus === 'PAID' || order.status === 'COMPLETED') {
            const orderTotal = order.totalAmount || 0;
            
            revenueByMonth[monthStr] = (revenueByMonth[monthStr] || 0) + orderTotal;

            if (!revenueByFullDate[dateKey]) {
              revenueByFullDate[dateKey] = {
                timestamp: dayTimestamp,
                display: dateKey,
                amount: 0
              };
            }
            revenueByFullDate[dateKey].amount += orderTotal;

            if (fullDateStr === todayStr) {
              todayRev += orderTotal;
              todayOrders++;
            }

            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const pId = item.productId;
                const qty = item.quantity || 0;
                const matchedProd = products.find((p: any) => p.id === pId);
                const pName = matchedProd ? matchedProd.name : `Sản phẩm #${pId}`;
                const pPrice = matchedProd ? matchedProd.price : 0;

                if (!productSalesMap[pId]) {
                  productSalesMap[pId] = { name: pName, sold: 0, revenue: 0 };
                }
                productSalesMap[pId].sold += qty;
                productSalesMap[pId].revenue += qty * pPrice;
              });
            }
          }
        });

        const sortedMonths = Object.keys(revenueByMonth).sort();
        const formattedLineData = sortedMonths.map(month => ({
          date: month,
          'Doanh thu thực': revenueByMonth[month]
        }));

        const sortedDatesArray = Object.values(revenueByFullDate)
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-10);

        const formattedBarData = sortedDatesArray.map(item => ({
          dateDisplay: item.display,
          'Doanh thu': item.amount
        }));

        // Trích xuất chính xác Top 5 sản phẩm bán chạy nhất
        const sortedProducts = Object.values(productSalesMap)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5);

        const categoryGroup: { [key: string]: number } = {};
        products.forEach((prod: any) => {
          let catName = 'Món khác';
          if (prod.category?.name) {
            catName = prod.category.name;
          } else if (prod.categoryId) {
            const matchCat = categories.find((c: any) => c.id === prod.categoryId);
            if (matchCat) catName = matchCat.name;
          }
          categoryGroup[catName] = (categoryGroup[catName] || 0) + 1;
        });
        
        const formattedCategoryData = Object.keys(categoryGroup).map((key, idx) => ({
          name: key,
          value: categoryGroup[key],
          color: COLORS[idx % COLORS.length]
        }));

        setStats({
          todayRevenue: todayRev,
          todayOrdersCount: todayOrders,
          processingOrdersCount: processingOrders,
          topProductSold: sortedProducts[0]?.sold || 0,
          topProductName: sortedProducts[0]?.name || 'Chưa có',
        });
        
        setRevenueChartData(formattedLineData.length > 0 ? formattedLineData : [{ date: 'Chưa có dữ liệu', 'Doanh thu thực': 0 }]);
        setWeeklyBarData(formattedBarData.length > 0 ? formattedBarData : [{ dateDisplay: 'N/A', 'Doanh thu': 0 }]);
        setCategoryChartData(formattedCategoryData);
        setRealIngredients(ingredients);
        setTopProducts(sortedProducts); // Lưu danh sách món bán chạy vào State công khai

      } catch (error) {
        console.error("Lỗi lấy dữ liệu thống kê hệ thống:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const exportToExcel = () => {
    if (realIngredients.length === 0) {
      alert("Không có dữ liệu nguyên liệu thực tế để xuất!");
      return;
    }
    const workbook = XLSX.utils.book_new();
    const sheetDataIngredients = [
      ["BÁO CÁO THỐNG KÊ TỒN KHO NGUYÊN VẬT LIỆU THỰC TẾ"],
      [`Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`],
      [],
      ["STT", "Mã Barcode", "Tên nguyên vật liệu", "Số lượng tồn kho", "Hạn mức tối thiểu", "Đơn vị tính", "Trạng thái"]
    ];

    realIngredients.forEach((ing, index) => {
      sheetDataIngredients.push([
        (index + 1).toString(),
        ing.barcode || '---',
        ing.name,
        ing.stockQuantity.toString(),
        ing.minimumStock.toString(),
        ing.unit,
        ing.status === 'ACTIVE' || ing.status === 1 || ing.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng'
      ]);
    });

    const worksheetIngredients = XLSX.utils.aoa_to_sheet(sheetDataIngredients);
    XLSX.utils.book_append_sheet(workbook, worksheetIngredients, "Kho Nguyên Liệu");
    XLSX.writeFile(workbook, `Bao_Cao_Thong_Ke_Kho_Thuc_Te_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#4318FF]" />
        <p className="text-sm font-medium text-gray-500">Đang tổng hợp dữ liệu thời gian thực từ database...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F4F7FE] min-h-screen font-sans">
      
      {/* TIÊU ĐỀ HỆ THỐNG */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-[14px] text-[#707E94] font-medium">Trang / Bảng điều khiển</p>
          <h1 className="text-3xl font-bold text-[#1B254B] tracking-tight">Bảng Thống Kê</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F4F7FE] text-xs font-bold text-[#1B254B]">
            <Calendar className="w-3.5 h-3.5 text-[#a3b1cc]" />
            <span>Chu kỳ:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="border-none shadow-none h-auto p-0 focus:ring-0 font-bold text-[#4318FF] bg-transparent">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={exportToExcel} 
            className="bg-[#10B981] hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm flex items-center gap-2 h-8 px-4 text-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* KHỐI CHỈ SỐ TOP METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-6">
        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-[#4318FF]" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Doanh Thu</p>
            <h4 className="text-base font-bold text-[#1B254B] truncate">{stats.todayRevenue.toLocaleString('vi-VN')}₫</h4>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#4318FF]" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Đơn Hàng</p>
            <h4 className="text-base font-bold text-[#1B254B]">{stats.todayOrdersCount} Đơn</h4>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#4318FF]" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Top Best</p>
            <h4 className="text-base font-bold text-[#1B254B] truncate">{stats.topProductName}</h4>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-500" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Đang Xử Lý</p>
            <h4 className="text-base font-bold text-[#1B254B]">{stats.processingOrdersCount}</h4>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <Layers3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Nhóm Món</p>
            <h4 className="text-base font-bold text-[#1B254B]">{categoryChartData.length}</h4>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="truncate">
            <p className="text-[12px] font-medium text-[#A3AED0] uppercase tracking-wider">Kho Hàng</p>
            <h4 className="text-base font-bold text-[#1B254B]">{realIngredients.length} loại</h4>
          </div>
        </Card>
      </div>

      {/* KHU VỰC 2 BIỂU ĐỒ CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Biểu đồ đường: Thống kê doanh thu theo tháng */}
        <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#A3AED0] bg-[#F4F7FE] px-3 py-1 rounded-lg w-max">
                <Calendar className="w-3 h-3" />
                <span>Thống kê theo tháng</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#1B254B] mt-2">
                {stats.todayRevenue > 0 ? `${stats.todayRevenue.toLocaleString('vi-VN')}₫` : 'Dữ liệu Realtime'}
              </h2>
              <p className="text-xs text-[#A3AED0] font-medium mt-0.5">Biến động tổng doanh thu thực tế</p>
            </div>
            <div className="p-2 bg-[#F4F7FE] rounded-lg text-[#4318FF]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#A3AED0" tickLine={false} axisLine={false} fontSize={12} dy={10} />
                <YAxis stroke="#A3AED0" tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu thực']} />
                <Area type="monotone" dataKey="Doanh thu thực" stroke="#4318FF" strokeWidth={3.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Biểu đồ cột: Doanh thu theo Ngày/Tháng tuyến tính */}
        <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1B254B]">Doanh Ngân Từng Ngày</h3>
            <div className="p-2 bg-[#F4F7FE] rounded-lg text-[#4318FF]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={16}>
                <XAxis dataKey="dateDisplay" stroke="#A3AED0" tickLine={false} axisLine={false} fontSize={11} dy={10} />
                <YAxis stroke="#A3AED0" tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu ngày']}
                  cursor={{ fill: '#F4F7FE' }}
                />
                <Bar dataKey="Doanh thu" fill="#4318FF" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* KHU VỰC BẢNG DỮ LIỆU INGREDIENTS REALTIME VÀ TOP MÓN BÁN CHẠY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột trái: Kiểm tra kho hàng (Chiếm 2 phần diện tích rộng) */}
        <Card className="rounded-3xl border-none shadow-sm bg-white p-6 lg:col-span-2">
          <div className="flex items-center gap-2 pb-4 mb-2 border-b border-gray-100">
            <Layers className="w-5 h-5 text-[#4318FF]" />
            <h3 className="text-lg font-bold text-[#1B254B]">Kiểm Tra Kho Thực Tế (Đường truyền Realtime)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[#A3AED0] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-2">Tên Nguyên Liệu</th>
                  <th className="py-3 px-2">Mã Vạch</th>
                  <th className="py-3 px-2 text-right">Số Lượng Tồn</th>
                  <th className="py-3 px-2 text-right">Mức Tối Thiểu</th>
                  <th className="py-3 px-2 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {realIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[#A3AED0] font-medium">Không tìm thấy dữ liệu từ hệ thống database.</td>
                  </tr>
                ) : (
                  realIngredients.map((ing) => {
                    const isLowStock = ing.stockQuantity <= ing.minimumStock;
                    return (
                      <tr key={ing.id} className="hover:bg-[#F4F7FE]/50 transition-colors">
                        <td className="py-3.5 px-2 font-bold text-[#1B254B]">{ing.name}</td>
                        <td className="py-3.5 px-2 text-[#707E94] font-mono">{ing.barcode || '---'}</td>
                        <td className={`py-3.5 px-2 text-right font-bold ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                          {ing.stockQuantity} <span className="text-[10px] font-normal text-gray-400">{ing.unit}</span>
                        </td>
                        <td className="py-3.5 px-2 text-right text-[#707E94] font-medium">{ing.minimumStock} {ing.unit}</td>
                        <td className="py-3.5 px-2 text-center">
                          {isLowStock ? (
                            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-bold">Cần nhập kho</span>
                          ) : (
                            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-[10px] font-bold">An toàn</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cột phải: Cơ cấu nhóm món & TOP 5 MÓN BÁN CHẠY NHẤT */}
        <div className="flex flex-col gap-6">
          
          {/* Box 1: Bảng xếp hạng món bán chạy nhất */}
          <Card className="rounded-3xl border-none shadow-sm bg-white p-5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#1B254B]">Top 5 Món Bán Chạy Nhất</h3>
            </div>
            <div className="flex flex-col gap-3">
              {topProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có dữ liệu bán hàng.</p>
              ) : (
                topProducts.map((prod, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-[#F4F7FE]/50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-extrabold ${
                        index === 0 ? 'bg-amber-100 text-amber-600' : 
                        index === 1 ? 'bg-slate-100 text-slate-600' : 
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-[#1B254B] truncate">{prod.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[#4318FF]">{prod.sold}</span> <span className="text-[10px] text-gray-400">món</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Box 2: Cơ cấu nhóm món */}
          <Card className="rounded-3xl border-none shadow-sm bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-[#1B254B]">Cơ Cấu Nhóm Món</h3>
              </div>
              
              <div className="h-[120px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData.length > 0 ? categoryChartData : [{name:'Mẫu', value: 1}]} cx="50%" cy="50%" innerRadius={40} outerRadius={52} paddingAngle={4} dataKey="value">
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="shadow-sm border border-gray-50 rounded-2xl p-2.5 grid grid-cols-2 gap-1.5 mt-2 text-[10px] max-h-[70px] overflow-y-auto">
                {categoryChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[#707E94] font-medium truncate">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-[#1B254B]">Nguyên liệu cần nhập</span>
              </div>
              <span className="bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
                {realIngredients.filter(ing => ing.stockQuantity <= ing.minimumStock).length} Loại
              </span>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}