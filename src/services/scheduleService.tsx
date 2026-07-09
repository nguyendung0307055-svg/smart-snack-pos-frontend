import httpAxios from "./httpAxios";

// ==========================================
// ĐỊNH NGHĨA CÁC INTERFACE (TYPES)
// ==========================================

export interface Shift {
  id: number;
  name: string;        // "Morning", "Afternoon", "Evening"
  startTime: string;   // "07:00"
  endTime: string;     // "12:00"
  salaryPerHour: number;
}
export interface ScheduleRequest {
  userId: number;
  shiftId: number;
  dayOfWeek: number;
  weekOfYear: number;
}

export interface AvailabilityRequest {
  userId: number;
  dayOfWeek: number;   // 2: Thứ 2, ..., 8: Chủ Nhật
  shiftId: number;     // Thay thế cho shiftType cũ
}

export interface AvailabilityResponse {
  id: number;
  user: {
    id: number;
    name: string;
  };
  dayOfWeek: number;
  shift: Shift;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Schedule {
  id: number;
  user: {
    id: number;
    name: string;
  };
  shift: Shift;
  dayOfWeek: number;
  weekOfYear: number;
}

export interface AttendanceResponse {
  id: number;
  schedule: Schedule;

  checkIn: string | null;

  checkOut: string | null;

  status: "PRESENT" | "LATE" | "ABSENT";

  lateMinutes: number;

  lateFine: number;
}

export interface PayrollResponse {
  userId: number;
  userName: string;
  totalShifts: number;
  totalHours: number;
  baseSalary: number;
  totalFines: number;
  finalSalary: number;
}

// ==========================================
// ĐIỀU PHỐI ĐỐI TƯỢNG API SERVICE
// ==========================================

const scheduleService = {

  // ------------------------------------------
  // 1. CÁC API VỀ QUẢN LÝ CA LÀM (SHIFT)
  // ------------------------------------------

  getAllShifts: async (): Promise<Shift[]> => {
    const response = await httpAxios.get("/shifts");
    return response.data;
  },

  createShift: async (data: Omit<Shift, "id">): Promise<Shift> => {
    const response = await httpAxios.post("/shifts", data);
    return response.data;
  },

  // ------------------------------------------
  // 2. CÁC API VỀ LỊCH ĐĂNG KÝ RẢNH (AVAILABILITY)
  // ------------------------------------------

  // Lấy danh sách rảnh, có thể lọc theo trạng thái: ?status=PENDING
  getAvailabilities: async (status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<AvailabilityResponse[]> => {
    let url = "/schedules/availabilities";
    if (status) {
      url += `?status=${status}`;
    }
    const response = await httpAxios.get(url);
    return response.data;
  },

  // Nhân viên hoặc Admin đăng ký lịch rảnh theo ShiftId
  registerAvailability: async (data: AvailabilityRequest): Promise<AvailabilityResponse> => {
    const response = await httpAxios.post("/schedules/availabilities", data);
    return response.data;
  },

  // Admin duyệt (APPROVED) hoặc từ chối (REJECTED) lịch rảnh của nhân viên
  reviewAvailability: async (id: number, status: "APPROVED" | "REJECTED"): Promise<AvailabilityResponse> => {
    const response = await httpAxios.put(`/schedules/availabilities/${id}/review`, { status });
    return response.data;
  },

  // ------------------------------------------
  // 3. CÁC API VỀ LỊCH LÀM VIỆC CHÍNH THỨC & THUẬT TOÁN (SCHEDULE)
  // ------------------------------------------

  // Kích hoạt thuật toán tự động xếp ca theo tuần của năm
  autoGenerateSchedule: async (weekOfYear: number): Promise<string> => {
    const response = await httpAxios.post(`/schedules/auto-generate?weekOfYear=${weekOfYear}`);
    return response.data; // Trả về thông báo thành công từ Backend
  },

  // Lấy lịch làm việc theo tuần hoặc theo mã cá nhân của nhân viên
  getSchedules: async (weekOfYear?: number, userId?: number): Promise<Schedule[]> => {
    let url = "/schedules";
    const params = new URLSearchParams();

    if (weekOfYear) params.append("weekOfYear", weekOfYear.toString());
    if (userId) params.append("userId", userId.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await httpAxios.get(url);
    return response.data;
  },
  createSchedule: async (data: ScheduleRequest): Promise<Schedule> => {
    const response = await httpAxios.post("/schedules", data);
    return response.data;
  },
  getMyScheduleToday: async () => {
    const response = await httpAxios.get("/schedules/me");
    return response.data;
  },

  // ------------------------------------------
  // 4. CÁC API VỀ CHẤM CÔNG (ATTENDANCE) & TÍNH LƯƠNG (PAYROLL)
  // ------------------------------------------

  checkIn: async (scheduleId: number): Promise<AttendanceResponse> => {
    const response = await httpAxios.post(`/attendance/check-in/${scheduleId}`);
    return response.data;
  },

  checkOut: async (scheduleId: number): Promise<AttendanceResponse> => {
    const response = await httpAxios.post(`/attendance/check-out/${scheduleId}`);
    return response.data;
  },

  getAttendanceHistory: async (userId: number): Promise<AttendanceResponse[]> => {
    const response = await httpAxios.get(`/attendance/history/${userId}`);
    return response.data;
  },

  // Admin lấy báo cáo bảng lương tổng hợp của tất cả nhân viên trong tháng
  getMonthlyPayroll: async (): Promise<PayrollResponse[]> => {
    const response = await httpAxios.get("/attendance/payroll");
    return response.data;
  }
};

export default scheduleService;