import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import scheduleService, { Shift } from '../../../services/scheduleService';

// Cấu trúc danh sách ngày trong tuần đã chuẩn hóa chính tả
const daysOfWeek = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

export function UserAvailability() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedSlots, setCheckedSlots] = useState<{ [key: string]: boolean }>({});

  const loadEmployeeData = async () => {
    try {
      // Gọi cả 2 API, nếu 1 trong 2 lỗi 500 thì bắt lỗi riêng biệt không làm chết luồng xử lý
      const shiftsRes = await scheduleService.getAllShifts().catch((err) => {
        console.error("Lỗi lấy ca làm việc từ DB:", err);
        return [];
      });

      const myAvailRes = await scheduleService.getAvailabilities().catch((err) => {
        console.error("Lỗi lấy lịch rảnh cá nhân:", err);
        return [];
      });

      if (shiftsRes.length === 0) {
        toast.error("Hệ thống chưa có ca làm việc!");
        return;
      }

      setShifts(shiftsRes);
      const initialChecked: { [key: string]: boolean } = {};
      if (Array.isArray(myAvailRes)) {
        myAvailRes.forEach((avail: any) => {
          const shiftId = avail.shift?.id || avail.shiftId;
          if (avail.dayOfWeek && shiftId) {
            initialChecked[`${avail.dayOfWeek}-${shiftId}`] = true;
          }
        });
      }
      setCheckedSlots(initialChecked);
    } catch (error) {
      toast.error('Không thể xử lý dữ liệu cấu hình lịch rảnh!');
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const handleSlotChange = (dayValue: number, shiftId: number, checked: boolean) => {
    setCheckedSlots(prev => ({
      ...prev,
      [`${dayValue}-${shiftId}`]: checked
    }));
  };

  const handleSaveAvailability = async () => {
    setIsSubmitting(true);
    try {
      const selectedAvailabilities = Object.keys(checkedSlots)
        .filter(key => checkedSlots[key] === true)
        .map(key => {
          const [dayOfWeek, shiftId] = key.split('-');
          return {
            userId: 0, 
            dayOfWeek: parseInt(dayOfWeek),
            shiftId: parseInt(shiftId)
          };
        });

      if (selectedAvailabilities.length === 0) {
        toast.warning('Vui lòng chọn ít nhất một khung giờ rảnh!');
        setIsSubmitting(false);
        return;
      }

      for (const item of selectedAvailabilities) {
        await scheduleService.registerAvailability(item);
      }

      toast.success('Đã cập nhật lịch rảnh cá nhân lên hệ thống!');
      loadEmployeeData();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu lịch rảnh!');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng ký lịch rảnh cá nhân</h1>
          <p className="text-gray-500 mt-1">Chọn các ca bạn sẵn sàng đi làm để hệ thống tự xếp lịch</p>
        </div>
        <Button onClick={handleSaveAvailability} className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Đang xử lý...' : 'Lưu lịch rảnh'}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm mb-6 flex gap-2.5 items-start">
        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Cách hoạt động:</strong> Tích chọn ô tương ứng với khoảng thời gian rảnh của bạn.
          Quản lý sẽ tiến hành chạy thuật toán <strong>Tự động điều phối ca</strong> dựa trên nguyện vọng này.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">⏱️ Khung thời gian nguyện vọng</CardTitle>
          <CardDescription>Trạng thái rảnh / bận hàng tuần</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-4 text-gray-600 font-semibold w-40">Ca làm việc</th>
                  {daysOfWeek.map(day => (
                    <th key={day.value} className="text-center p-4 text-gray-600 font-semibold min-w-[110px]">{day.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id} className="border-b hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 border-r border-slate-100">
                      <div className="font-semibold text-gray-800">{shift.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{shift.startTime} - {shift.endTime}</div>
                    </td>

                    {daysOfWeek.map(day => {
                      const slotKey = `${day.value}-${shift.id}`;
                      const isChecked = !!checkedSlots[slotKey];

                      return (
                        <td
                          key={day.value}
                          className={`p-4 text-center border-r border-slate-100 cursor-pointer select-none transition-colors ${isChecked ? 'bg-green-50/60 hover:bg-green-100/80' : 'hover:bg-slate-100/70'
                            }`}
                          onClick={() => handleSlotChange(day.value, shift.id, !isChecked)}
                        >
                          {/* Sử dụng pointer-events-none để toàn bộ ô td bắt trọn vẹn click chuột */}
                          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                            <Checkbox
                              id={slotKey}
                              checked={isChecked}
                              className="w-5 h-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <label htmlFor={slotKey} className={`text-[11px] font-semibold ${isChecked ? 'text-green-700' : 'text-gray-400'}`}>
                              {isChecked ? 'Rảnh' : 'Bận'}
                            </label>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}