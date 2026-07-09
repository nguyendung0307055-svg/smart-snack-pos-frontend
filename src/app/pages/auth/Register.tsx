import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import authService from "../../../services/authService";
import { Loader2, Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  // State lưu thông tin Form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "STAFF",
  });

  // States hỗ trợ UI/UX
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // Validate cơ bản phía Client
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.warning("Vui lòng điền đầy đủ thông tin tài khoản");
      return;
    }

    if (formData.password.length < 4) {
      toast.warning("Mật khẩu phải có ít nhất 4 ký tự");
      return;
    }

    setLoading(true);
    try {
      await authService.register(formData);
      toast.success("Đăng ký thành công 🎉");
      navigate("/");
    } catch (error) {
      toast.error("Đăng ký thất bại. Tài khoản có thể đã tồn tại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all duration-300 hover:shadow-2xl">
        
        {/* Tiêu đề & Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 mb-3">
            <span className="text-white text-2xl font-bold">📝</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-slate-400 text-sm mt-1">Đăng ký thành viên hệ thống Smart Snack</p>
        </div>

        <div className="space-y-5">
          {/* Input Tên đăng nhập */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-600">Tên đăng nhập</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="Nhập tài khoản mong muốn..."
                value={formData.username}
                disabled={loading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
          </div>

          {/* Input Mật khẩu */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-600">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-slate-200 pl-10 pr-10 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="Tối thiểu 4 ký tự"
                value={formData.password}
                disabled={loading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Select Chọn Vai trò (Role) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-600">Bộ phận làm việc</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <select
                className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-700 bg-white transition-all appearance-none cursor-pointer"
                value={formData.role}
                disabled={loading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
              >
                <option value="STAFF">Nhân viên (Staff)</option>
                <option value="KITCHEN">Nhân viên bếp (Kitchen)</option>
              </select>
              {/* Thêm icon mũi tên nhỏ tùy biến cho thanh select đẹp hơn */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Nút Đăng ký */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý hệ thống...
              </>
            ) : (
              "Đăng ký"
            )}
          </button>

          {/* Quay lại trang Đăng nhập */}
          <div className="text-center text-sm text-slate-500 mt-4">
            <span>Đã có tài khoản hệ thống? </span>
            <Link
              to="/"
              className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}