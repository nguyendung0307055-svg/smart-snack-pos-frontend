import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Clock, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import scheduleService, { AttendanceResponse, PayrollResponse } from '../../../services/scheduleService';
import authService from '../../../services/authService';

export function Shifts() {
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  const [payrollReport, setPayrollReport] = useState<PayrollResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const fetchAttendanceAndPayroll = async () => {
    try {
      const uData = await authService.getAll();
      setUsers(uData);

      if (uData.length > 0) {
        const defaultId = uData[0].id;
        setSelectedUser(String(defaultId));
        const attHistory = await scheduleService.getAttendanceHistory(defaultId);
        setAttendances(attHistory);
      }

      const payrollData = await scheduleService.getMonthlyPayroll();
      setPayrollReport(payrollData);
    } catch (e) {
      console.error("Lỗi kết nối dữ liệu chấm công và lương từ máy chủ.");
    }
  };

  useEffect(() => {
    fetchAttendanceAndPayroll();
  }, []);

  const handleUserChange = async (userIdStr: string) => {
    setSelectedUser(userIdStr);
    try {
      const data = await scheduleService.getAttendanceHistory(parseInt(userIdStr));
      setAttendances(data);
    } catch (err) {
      toast.error("Không thể lấy dữ liệu lịch sử chấm công!");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý phiên chấm công & Lương</h1>
          <p className="text-gray-500 mt-1">Giám sát Check-in/Check-out thực tế của nhân sự theo cấu hình Ca</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <DollarSign className="w-4 h-4" /> Xuất bảng lương tháng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Báo cáo lương tổng hợp tự động</DialogTitle>
            </DialogHeader>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-center">Tổng số ca</TableHead>
                  <TableHead className="text-center">Tổng giờ công</TableHead>
                  <TableHead className="text-right">Lương cơ bản</TableHead>
                  <TableHead className="text-right">Phạt đi muộn</TableHead>
                  <TableHead className="text-right text-emerald-600 font-bold">Thực nhận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollReport.map((p) => (
                  <TableRow key={p.userId}>
                    <TableCell className="font-medium">{p.userName}</TableCell>
                    <TableCell className="text-center">{p.totalShifts}</TableCell>
                    <TableCell className="text-center">{p.totalHours.toFixed(1)}h</TableCell>
                    <TableCell className="text-right">{p.baseSalary.toLocaleString('vi-VN')}₫</TableCell>
                    <TableCell className="text-right text-red-500">-{p.totalFines.toLocaleString('vi-VN')}₫</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{p.finalSalary.toLocaleString('vi-VN')}₫</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng số nhân sự</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length} người</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Số ca đi muộn</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {attendances.filter(a => a.status === 'LATE').length} ca làm
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tỷ lệ đóng ca làm việc</CardTitle>
            <Clock className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendances.length > 0 ? ((attendances.filter(a => a.checkOut).length / attendances.length) * 100).toFixed(0) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Nhật ký đóng/mở ca chấm công thực tế</CardTitle>
          <Select value={selectedUser} onValueChange={handleUserChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Chọn nhân viên" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name || u.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiên</TableHead>
                <TableHead>Ca đăng ký</TableHead>
                <TableHead>Thứ trong tuần</TableHead>
                <TableHead>Giờ Check-In</TableHead>
                <TableHead>Giờ Check-Out</TableHead>
                <TableHead className="text-right">Khấu trừ đi muộn</TableHead>
                <TableHead className="text-center">Trạng thái ca</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.length > 0 ? (
                attendances.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-mono text-xs">#SCH-{att.schedule?.id}</TableCell>
                    <TableCell className="font-medium">
                      {att.schedule?.shift?.name} ({att.schedule?.shift?.startTime} - {att.schedule?.shift?.endTime})
                    </TableCell>
                    <TableCell>Thứ {att.schedule?.dayOfWeek}</TableCell>
                    <TableCell className="text-gray-700">{att.checkIn || '---'}</TableCell>
                    <TableCell className="text-gray-700">{att.checkOut || '---'}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {att.lateFine > 0 ? `-${att.lateFine.toLocaleString('vi-VN')}₫` : '0₫'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        att.status === 'PRESENT' ? 'default' : 
                        att.status === 'LATE' ? 'destructive' : 'secondary'
                      }>
                        {att.status === 'PRESENT' ? 'Đúng giờ' : att.status === 'LATE' ? 'Đi muộn' : 'Vắng mặt'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-6">
                    Không tìm thấy dữ liệu chấm công cho nhân viên này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}