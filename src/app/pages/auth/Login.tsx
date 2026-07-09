import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import authService from "../../../services/authService";
import { Loader2, Eye, EyeOff, Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // State lưu thông tin Form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // States hỗ trợ UI/UX
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.warning("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login(formData);

      // Chỉ lưu thông tin user để hiển thị
      localStorage.setItem("user", JSON.stringify(data));

      toast.success("Đăng nhập thành công 🎉");

      if (data.role === "STAFF") {
        navigate("/pos");
      } else if (data.role === "ADMIN") {
        navigate("/admin");
      } else if (data.role === "KITCHEN") {
        navigate("/kitchen");
      }

    } catch (error) {
      toast.error("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-all duration-300 hover:shadow-2xl">

        {/* Logo hoặc Tên hệ thống */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 mb-3">
            <span className="text-white text-2xl font-bold">🍹</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Smart Snack
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hệ thống quản lý vận hành nội bộ</p>
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
                className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="Nhập tài khoản của bạn..."
                value={formData.username}
                disabled={loading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
                className="w-full border border-slate-200 pl-10 pr-10 py-3 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                value={formData.password}
                disabled={loading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

          {/* Nút Đăng nhập */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>

          {/* Link chuyển đổi đăng ký hệ thống */}
          <div className="text-center text-sm text-slate-500 mt-4">
            <span>Chưa có tài khoản đăng nhập? </span>
            <Link
              to="/register"
              className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}