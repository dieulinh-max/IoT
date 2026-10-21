
import React,{ useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/Auth.css";

const API = "http://localhost:8080/api/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", msv: "", date: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.msv.trim() || !form.date || !form.password || !form.confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          msv: form.msv.trim(),
          date: form.date,
          password: form.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Đăng ký thất bại.");
      setSuccess("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Không thể kết nối máy chủ. Hãy kiểm tra Backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand auth-brand-register">
          <div className="auth-logo"><span className="auth-logo-icon">◇</span> SensorIoT</div>
          <div className="auth-brand-copy register-copy">
            <h1>Tham gia hệ thống.<br />Quản trị Trạm Cảm Biến.</h1>
          </div>
        </aside>

        <section className="auth-form-panel">
          <form className="auth-form register-form" onSubmit={handleSubmit}>
            <h2>Tạo tài khoản mới</h2>
            <p className="auth-subtitle">Điền các thông tin bên dưới để đăng ký quyền quản trị viên.</p>

            <div className="auth-two-columns">
              <div><label htmlFor="name">HỌ VÀ TÊN</label><input id="name" name="name" value={form.name} onChange={change} placeholder="Nhập họ và tên" /></div>
              <div><label htmlFor="msv">MÃ SINH VIÊN</label><input id="msv" name="msv" value={form.msv} onChange={change} placeholder="Ví dụ: B23DCCN481" /></div>
            </div>

            <label htmlFor="date">NGÀY SINH</label>
            <input id="date" name="date" type="date" value={form.date} onChange={change} />

            <label htmlFor="password">MẬT KHẨU</label>
            <div className="auth-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={change}
                placeholder="Tối thiểu 6 ký tự"
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <label htmlFor="confirmPassword">XÁC NHẬN MẬT KHẨU</label>
            <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={change} placeholder="Nhập lại mật khẩu" />

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}
            <button className="auth-submit register-submit" type="submit" disabled={loading}>{loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}</button>
            <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
          </form>
        </section>
      </section>
    </main>
  );
}
