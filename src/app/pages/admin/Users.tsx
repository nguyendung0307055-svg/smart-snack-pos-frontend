import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Plus, X, Loader2, Trash2, Edit, Search, Filter, UserCheck } from 'lucide-react';
import authService from '../../../services/authService';

interface UserItem {
  id: number;
  username: string;
  name: string;
  role: string;
}

export function Users() {
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  
  // State Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // State Form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getAll();
      setUserList(data);
    } catch (err) {
      console.error("Lỗi khi kết nối lấy danh sách nhân viên:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Định nghĩa màu sắc và nhãn cho từng Role gọn đẹp hơn
  const getRoleConfig = (roleStr: string) => {
    const roleMap = {
      ADMIN: { label: 'Quản trị viên', className: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
      STAFF: { label: 'Thu ngân / Phục vụ', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' },
      KITCHEN: { label: 'Bộ phận Bếp', className: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' },
    };
    return roleMap[roleStr as keyof typeof roleMap] || { label: roleStr, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const handleEditClick = (user: UserItem) => {
    setEditingId(user.id);
    setUsername(user.username);
    setName(user.name || '');
    setPassword('');
    setRole(user.role);
    setError('');
    setIsOpenModal(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('STAFF');
    setError('');
    setIsOpenModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !username.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    try {
      if (editingId) {
        await authService.update(editingId, { username, name, password, role });
      } else {
        if (!password) {
          setError('Vui lòng nhập mật khẩu cho tài khoản mới!');
          return;
        }
        await authService.register({ username, name, password, role });
      }
      await fetchUsers();
      setIsOpenModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống không?")) {
      try {
        await authService.delete(id);
        await fetchUsers();
      } catch (err) {
        alert("Không thể xóa nhân viên này!");
      }
    }
  };

  const getAvatarFallback = (fullName: string, fallbackUsername: string) => {
    const targetName = fullName || fallbackUsername;
    const words = targetName.trim().split(' ');
    if (words.length >= 2) {
      return (words[words.length - 2].substring(0, 1) + words[words.length - 1].substring(0, 1)).toUpperCase();
    }
    return targetName.substring(0, 2).toUpperCase();
  };

  // Logic Tìm kiếm kết hợp Lọc theo vai trò trực tiếp trên giao diện
  const filteredUsers = userList.filter(user => {
    const matchSearch = 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm);
    
    const matchRole = selectedRole === 'ALL' || user.role === selectedRole;
    
    return matchSearch && matchRole;
  });

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {/* 1. Header cao cấp */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-primary" /> Quản lý tài khoản hệ thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý phân quyền, thông tin cá nhân và tài khoản truy cập POS</p>
        </div>
        <Button className="gap-2 shadow-sm shadow-primary/20 font-medium" onClick={handleAddClick}>
          <Plus className="w-4 h-4" /> Thêm tài khoản mới
        </Button>
      </div>

      {/* 2. Thanh công cụ Tìm kiếm & Bộ lọc (Bộ trợ trải nghiệm cực tốt) */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên, tài khoản hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-sm bg-transparent border-none focus:outline-none text-slate-700 cursor-pointer pr-2 font-medium"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="STAFF">STAFF (Thu ngân)</option>
            <option value="ADMIN">ADMIN (Quản trị)</option>
            <option value="KITCHEN">KITCHEN (Bếp)</option>
          </select>
        </div>
      </div>

      {/* 3. Thể hiện trạng thái Loading hoặc hiển thị bảng dữ liệu chính */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-9 h-9 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">Đang đồng bộ dữ liệu thời gian thực...</p>
        </div>
      ) : (
        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Thành viên</th>
                    <th className="py-3.5 px-6">Tài khoản (Username)</th>
                    <th className="py-3.5 px-6">Vai trò hiện tại</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                        Không tìm thấy tài khoản nào khớp với bộ lọc!
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Cột Thành viên gồm Avatar và Tên */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                              <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                                {getAvatarFallback(user.name, user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate">{user.name || "Chưa cập nhật họ tên"}</div>
                              <div className="text-xs text-slate-400 mt-0.5">ID tài khoản: #{user.id}</div>
                            </div>
                          </div>
                        </td>
                        {/* Cột Tên đăng nhập */}
                        <td className="py-4 px-6 font-medium text-slate-600">
                          {user.username}
                        </td>
                        {/* Cột Vai trò phân quyền */}
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full border shadow-sm ${getRoleConfig(user.role).className}`}>
                            {getRoleConfig(user.role).label}
                          </Badge>
                        </td>
                        {/* Cột Nút Hành Động tinh gọn dạng Icon hoặc Text nút */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                              onClick={() => handleEditClick(user)}
                              title="Sửa tài khoản"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. MODAL POPUP (THÊM / SỬA) CHUẨN ĐẸP */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Cập nhật tài khoản hệ thống" : "Tạo tài khoản nhân viên mới"}
              </h2>
              <button onClick={() => setIsOpenModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {error && <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg font-medium">{error}</div>}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên nhân viên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Thùy Dung"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tên tài khoản đăng nhập <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: dungntt"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Mật khẩu truy cập {editingId && <span className="text-slate-400 lowercase font-normal">(để trống nếu giữ nguyên)</span>} {!editingId && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder={editingId ? "Nhập mật khẩu mới thay thế..." : "Tạo mật khẩu khởi tạo..."}
                  required={!editingId}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Vai trò điều phối hệ thống</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 cursor-pointer font-medium"
                >
                  <option value="STAFF">STAFF — Thu ngân / Phục vụ</option>
                  <option value="ADMIN">ADMIN — Quản trị viên tối cao</option>
                  <option value="KITCHEN">KITCHEN — Bộ phận điều phối bếp</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <Button type="button" variant="ghost" className="text-slate-500 hover:bg-slate-50" onClick={() => setIsOpenModal(false)}>Hủy bỏ</Button>
                <Button type="submit" className="font-medium shadow-sm">{editingId ? "Lưu thay đổi" : "Kích hoạt tài khoản"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}