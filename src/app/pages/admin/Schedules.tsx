import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, Calendar, UserCheck, Clock, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import scheduleService, { Shift } from '../../../services/scheduleService';
import authService from '../../../services/authService';

const daysOfWeek = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

export function Schedules() {
  const [currentSchedules, setCurrentSchedules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<number>(28);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('arrange');

  const [formDay, setFormDay] = useState<string>('');
  const [formShiftId, setFormShiftId] = useState<string>('');
  const [formUserId, setFormUserId] = useState<string>('');
  const [intelligentEmployees, setIntelligentEmployees] = useState<any[]>([]);

  const [availDay, setAvailDay] = useState<string>('');
  const [availShiftId, setAvailShiftId] = useState<string>('');
  const [availUserId, setAvailUserId] = useState<string>('');

  const loadBackendData = async () => {
    try {
      const [schedulesRes, usersRes, availRes, shiftsRes] = await Promise.all([
        scheduleService.getSchedules(selectedWeek),
        authService.getAll(),
        scheduleService.getAvailabilities(),
        scheduleService.getAllShifts()
      ]);
      setCurrentSchedules(schedulesRes);
      setUsers(usersRes);
      setAvailabilities(availRes);
      setShifts(shiftsRes);
    } catch (error) {
      toast.error('Không thể kết nối dữ liệu lịch làm việc với máy chủ Backend!');
    }
  };

  useEffect(() => {
    loadBackendData();
  }, [selectedWeek]);

  useEffect(() => {
    if (formDay && formShiftId) {
      const dayNum = parseInt(formDay);
      const shiftIdNum = parseInt(formShiftId);

      const matchedUserIds = availabilities
        .filter(a => {
          const dbDay = a.dayOfWeek;
          const dbShiftId = a.shift?.id || a.shiftId;
          return dbDay === dayNum && dbShiftId === shiftIdNum;
        })
        .map(a => String(a.user?.id || a.userId));

      const filteredUsers = users.filter(user => matchedUserIds.includes(String(user.id)));
      setIntelligentEmployees(filteredUsers);
      setFormUserId('');
    } else {
      setIntelligentEmployees([]);
    }
  }, [formDay, formShiftId, availabilities, users]);

  const handleAutoGenerate = async () => {
    try {
      const msg = await scheduleService.autoGenerateSchedule(selectedWeek);
      toast.success(msg || 'Thuật toán Backend đã tự động phân bổ ca thành công!');
      loadBackendData();
    } catch (error: any) {
      toast.error('Xếp ca tự động thất bại hoặc thiếu dữ liệu rảnh hợp lệ!');
    }
  };

  const handleSaveSchedule = async () => {
    if (!formDay || !formShiftId || !formUserId || formUserId === 'none') {
      toast.error('Vui lòng chọn đầy đủ ngày, ca và nhân viên!');
      return;
    }
    try {
      const payload = {
        userId: parseInt(formUserId),
        dayOfWeek: parseInt(formDay),
        shiftId: parseInt(formShiftId),
        weekOfYear: selectedWeek
      };

      console.log("Payload:", payload);

      await scheduleService.createSchedule(payload); toast.success('Đã xếp ca làm việc xuống database thành công!');
      setIsDialogOpen(false);
      loadBackendData();
      setFormDay(''); setFormShiftId(''); setFormUserId('');
    } catch (error: any) {
      toast.error('Xếp ca thất bại, vui lòng kiểm tra trùng lặp lịch!');
    }
  };

  const handleSaveAvailability = async () => {
    if (!availDay || !availShiftId || !availUserId) {
      toast.error('Vui lòng điền đủ thông tin lịch rảnh hộ!');
      return;
    }
    try {
      const payload = {
        userId: parseInt(availUserId),
        dayOfWeek: parseInt(availDay),
        shiftId: parseInt(availShiftId),
        weekOfYear: selectedWeek
      };
      await scheduleService.registerAvailability(payload);
      toast.success('Đã khai báo lịch rảnh hộ thành công!');
      setIsDialogOpen(false);
      loadBackendData();
      setAvailDay(''); setAvailShiftId(''); setAvailUserId('');
    } catch (error: any) {
      toast.error('Không thể tạo lịch rảnh hộ!');
    }
  };

  const filteredSchedules = selectedUser === 'all'
    ? currentSchedules
    : currentSchedules.filter(s => String(s.user?.id || s.userId) === String(selectedUser));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý lịch tuần tổng thể</h1>
          <p className="text-gray-500 mt-1">Điều phối lịch và chạy xếp ca thông minh kết nối Shift API</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" onClick={handleAutoGenerate}>
            <Wand2 className="w-4 h-4 text-purple-600" />
            Tự động xếp lịch (Tuần {selectedWeek})
          </Button>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Lọc nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Thêm thủ công
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bảng điều khiển điều phối</DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="arrange" className="gap-1"><Clock className="w-3.5 h-3.5" /> Xếp ca</TabsTrigger>
                </TabsList>

                <TabsContent value="arrange" className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Ngày làm việc</Label>
                    <Select value={formDay} onValueChange={setFormDay}>
                      <SelectTrigger><SelectValue placeholder="Chọn thứ" /></SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Ca làm việc trong hệ thống</Label>
                    <Select value={formShiftId} onValueChange={setFormShiftId}>
                      <SelectTrigger><SelectValue placeholder="Chọn ca" /></SelectTrigger>
                      <SelectContent>
                        {shifts.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.startTime} - {s.endTime})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="flex justify-between">
                      <span>Nhân viên có lịch trống</span>
                      {formDay && formShiftId && <span className="text-xs text-green-600 font-medium">✨ Tự động lọc rảnh</span>}
                    </Label>
                    <Select value={formUserId} onValueChange={setFormUserId} disabled={!formDay || !formShiftId}>
                      <SelectTrigger>
                        <SelectValue placeholder={formDay && formShiftId ? "Chọn nhân sự" : "Vui lòng chọn ngày và ca trước"} />
                      </SelectTrigger>
                      <SelectContent>
                        {intelligentEmployees.length > 0 ? (
                          intelligentEmployees.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.username}</SelectItem>)
                        ) : (
                          <SelectItem value="none" disabled>Không có ai rảnh ca này</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleSaveSchedule}>Xác nhận xếp ca</Button>
                  </div>
                </TabsContent>

             
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Thời khóa biểu phân bổ chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 bg-gray-50 w-36">Khung ca</th>
                  {daysOfWeek.map(d => <th key={d.value} className="text-center p-4 bg-gray-50 min-w-[130px]">{d.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id} className="border-b">
                    <td className="p-4 font-semibold bg-slate-50">
                      <Badge className="bg-blue-600 text-white block text-center py-1">{shift.name}</Badge>
                      <span className="text-[10px] text-gray-500 block text-center mt-1">{shift.startTime}-{shift.endTime}</span>
                    </td>
                    {daysOfWeek.map(day => {
                      const matchedSchedules = filteredSchedules.filter(s =>
                        s.dayOfWeek === day.value && (s.shift?.id === shift.id || s.shiftId === shift.id)
                      );
                      return (
                        <td key={day.value} className="p-2 text-center align-top border-r border-gray-100">
                          {matchedSchedules.length > 0 ? (
                            <div className="space-y-1.5">
                              {matchedSchedules.map((sc: any) => (
                                <div key={sc.id} className="bg-green-50 border border-green-200 rounded-md p-2 text-left">
                                  <p className="font-medium text-xs text-green-900">{sc.user?.name || sc.userName || 'Nhân viên'}</p>
                                </div>
                              ))}
                            </div>
                          ) : <div className="text-gray-300 text-xs py-3">-</div>}
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