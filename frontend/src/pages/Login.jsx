import React,{ useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";
import "../styles/Auth.css";

const API = "http://localhost:8080/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ msv: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.msv.trim() || !form.password) {
      setError("Vui lòng nhập mã sinh viên và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msv: form.msv.trim(), password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại.");

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("sensorIoTUser", JSON.stringify(data));
      if (!remember) localStorage.removeItem("sensorIoTUser");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Không thể kết nối máy chủ. Hãy kiểm tra Backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand auth-brand-login">
          <div className="auth-logo"><span className="auth-logo-icon">◇</span> SensorIoT</div>
          <div className="auth-brand-copy">
            <h1>Giám sát môi trường<br />Thông minh &amp; Tức thì.</h1>
            <p>Hệ thống thu thập dữ liệu nhiệt độ, độ ẩm và ánh sáng theo thời gian thực.</p>
            <div className="brand-stat"><span>🌡️</span><div><small>NHIỆT ĐỘ PHÒNG</small><b>28.4 °C <em>● Bình thường</em></b></div></div>
            <div className="brand-stat"><span>💧</span><div><small>ĐỘ ẨM KHÔNG KHÍ</small><b>52.1 % <em>● Ổn định</em></b></div></div>
          </div>
        </aside>

        <section className="auth-form-panel">
          <form className="auth-form login-form" onSubmit={handleSubmit}>
            <h2>Đăng nhập tài khoản</h2>
            <p className="auth-subtitle">Chào mừng bạn quay lại! Vui lòng điền thông tin để truy cập.</p>

            <label htmlFor="msv">MÃ SINH VIÊN</label>
            <div className="auth-input-wrap"><span>♙</span><input id="msv" name="msv" value={form.msv} onChange={change} placeholder="Nhập mã sinh viên" autoComplete="username" /></div>

            <label htmlFor="password">MẬT KHẨU</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={16} className="password-lock-icon" />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={change}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
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
            <div className="auth-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ghi nhớ đăng nhập</label><span className="forgot-disabled">Quên mật khẩu?</span></div>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
            <p className="auth-switch">Chưa có tài khoản quản trị? <Link to="/register">Đăng ký ngay</Link></p>
          </form>
        </section>
      </section>
    </main>
  );
}
