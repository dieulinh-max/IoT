import React, { useCallback, useEffect, useMemo, useState } from "react";
// (thông báo bật/tắt dùng state `notice`, không cần thêm thư viện)
import { Thermometer, Droplet, Sun, Fan, Lightbulb, Droplets } from "lucide-react";
import "../styles/Dashboard.css";

const DASHBOARD_API = "http://localhost:8080/api/dashboard";
const DEVICES_API = "http://localhost:8080/api/devices";
const REFRESH_MS = 2000; // Arduino gửi dữ liệu mỗi 2 giây
const CHART_LIMIT = 20; // 20 điểm = 40 giây gần nhất

const SENSOR_CONFIG = [
  { key: "temperature", label: "NHIỆT ĐỘ", unit: "°C", tone: "red", icon: "thermometer", sensorName: "Temperature" },
  { key: "humidity", label: "ĐỘ ẨM", unit: "%", tone: "purple", icon: "droplet", sensorName: "Humidity" },
  { key: "light", label: "ÁNH SÁNG", unit: "Lux", tone: "yellow", icon: "sun", sensorName: "Light" },
];

// Map theo tên thiết bị trong DB (viết hoa)
const DEVICE_CONFIG = {
  "FAN": { icon: "fan", tone: "red" },
  "LIGHT": { icon: "lightbulb", tone: "yellow" },
  "LED LIGHT": { icon: "lightbulb", tone: "yellow" },
  "HUMIDIFIER": { icon: "droplets", tone: "purple" },
};
const DEFAULT_DEVICE_CONFIG = { icon: "fan", tone: "red" };

const ICONS = {
  thermometer: Thermometer,
  droplet: Droplet,
  sun: Sun,
  fan: Fan,
  lightbulb: Lightbulb,
  droplets: Droplets,
};

// Cấu hình 2 khung biểu đồ
const CHART_PANELS = [
  {
    id: "temp-humidity",
    title: "Nhiệt độ & Độ ẩm",
    yMax: 150,
    yStep: 30,
    series: [
      { key: "temperature", label: "Nhiệt độ (°C)", color: "#ff8a80" },
      { key: "humidity", label: "Độ ẩm (%)", color: "#9350ff" },
    ],
  },
  {
    id: "light",
    title: "Ánh sáng",
    yMax: 1050,
    yStep: 150,
    series: [{ key: "light", label: "Ánh sáng", color: "#fbbf24" }],
  },
];

function getStoredUser() {
  try {
    const raw =
      localStorage.getItem("sensorIoTUser") ||
      sessionStorage.getItem("sensorIoTUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  return getStoredUser()?.id ?? null;
}

function TonedIcon({ name, tone, size = "lg" }) {
  const Icon = ICONS[name] || Thermometer;
  return (
    <span className={`dash-icon dash-icon--${size} tone-${tone}`}>
      <Icon size={size === "lg" ? 20 : 24} strokeWidth={2.2} />
    </span>
  );
}

// Định dạng đầy đủ: 2026-10-21 10:02:30
function formatFullTime(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value).replace("T", " ").replace("Z", "").slice(0, 19);
  }
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

function ChartPanel({ panel, rows, activeIndex, onHover, onLeave }) {
  const width = 804;
  const height = 330;
  const left = 84;
  const right = 24;
  const top = 16;
  const bottom = 86; // chừa chỗ cho nhãn thời gian xoay nghiêng
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const { yMax, yStep, series } = panel;

  const x = (i) => left + (rows.length <= 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW);
  const y = (v) => {
    const n = Math.min(Math.max(Number(v) || 0, 0), yMax);
    return top + plotH - (n / yMax) * plotH;
  };
  const makePath = (key) =>
    rows.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(r[key])}`).join(" ");
  const step = rows.length <= 1 ? plotW : plotW / (rows.length - 1);
  const ticks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, i) => i * yStep);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexWrap: "wrap", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>{panel.title}</strong>
        <ul className="dash-legend" style={{ margin: 0 }}>
          {series.map((s) => (
            <li key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Biểu đồ ${panel.title}`}>
        {/* Trục dọc + lưới */}
        {ticks.map((value) => {
          const yy = y(value);
          return (
            <g key={value}>
              <line x1={left} x2={width - right} y1={yy} y2={yy} className="dash-grid-line" />
              <text x={left - 10} y={yy} textAnchor="end" dominantBaseline="middle" className="dash-ytick">
                {value}
              </text>
            </g>
          );
        })}

        {/* Đường chỉ vị trí đang chọn */}
        {rows.length > 0 && (
          <line x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={top + plotH} className="dash-guide" />
        )}

        {/* Đường dữ liệu */}
        {series.map((s) => (
          <path key={s.key} d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {rows.map((row, i) => (
          <g key={`${row.time}-${i}`}>
            {series.map((s) => (
              <circle
                key={s.key}
                cx={x(i)}
                cy={y(row[s.key])}
                r={i === activeIndex ? 5 : 3}
                fill={s.color}
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}

            {/* Nhãn thời gian đầy đủ: 2026-10-21 10:02:30 */}
            <text
              x={x(i)}
              y={top + plotH + 16}
              textAnchor="end"
              transform={`rotate(-40 ${x(i)} ${top + plotH + 16})`}
              style={{
                fontSize: 10,
                fontWeight: i === activeIndex ? 700 : 500,
                fill: i === activeIndex ? "#6366f1" : "#334155",
              }}
            >
              {formatFullTime(row.time)}
            </text>

            {/* Vùng bắt chuột cho từng cột */}
            <rect
              x={x(i) - step / 2}
              y={top}
              width={step}
              height={plotH}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={onLeave}
              onClick={() => onHover(i)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function EnvironmentChart({ rows }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!rows.length) return <div className="dash-chart-wrap">Chưa có dữ liệu biểu đồ.</div>;

  // Mặc định hiển thị điểm mới nhất
  const activeIndex = Math.min(hoverIndex ?? rows.length - 1, rows.length - 1);
  const active = rows[activeIndex];

  return (
    <div className="dash-chart-wrap" style={{ overflowX: "auto" }}>
      {CHART_PANELS.map((panel) => (
        <ChartPanel
          key={panel.id}
          panel={panel}
          rows={rows}
          activeIndex={activeIndex}
          onHover={setHoverIndex}
          onLeave={() => setHoverIndex(null)}
        />
      ))}

    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartRows, setChartRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [controlBusy, setControlBusy] = useState(null);
  const [deviceError, setDeviceError] = useState("");
  // Thông báo khi bấm bật/tắt: { type: "pending" | "success" | "error", text }
  const [notice, setNotice] = useState(null);

  // Tự ẩn thông báo sau 3 giây (trừ lúc đang chờ phản hồi)
  useEffect(() => {
    if (!notice || notice.type === "pending") return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Thông tin người dùng lấy từ DB lúc đăng nhập
  const currentUser = useMemo(() => getStoredUser(), []);

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryResponse, chartResponse] = await Promise.all([
        fetch(`${DASHBOARD_API}/summary`),
        fetch(`${DASHBOARD_API}/chart?limit=${CHART_LIMIT}`),
      ]);

      if (!summaryResponse.ok || !chartResponse.ok) {
        throw new Error("Không thể tải dữ liệu Dashboard.");
      }

      const summaryData = await summaryResponse.json();
      const chartData = await chartResponse.json();

      setSummary(summaryData);
      setChartRows(Array.isArray(chartData) ? chartData : []);
      setError("");
    } catch (e) {
      setError(e.message || "Không kết nối được Backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const response = await fetch(DEVICES_API);
      if (!response.ok) throw new Error(`GET /api/devices lỗi ${response.status}`);
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : data.content || []);
    } catch (e) {
      setDeviceError(e.message || "Không thể tải danh sách thiết bị.");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadDevices();
    const timer = window.setInterval(loadDashboard, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadDashboard, loadDevices]);

  const stats = useMemo(
    () =>
      SENSOR_CONFIG.map((config) => {
        const value = summary?.[config.key];
        return {
          ...config,
          value: value?.value ?? null,
          unit: value?.unit || config.unit,
          sensorName: value?.sensorName || config.sensorName,
        };
      }),
    [summary]
  );

  const toggleDevice = async (device) => {
    const userId = getCurrentUserId();
    if (userId == null) {
      setDeviceError("Chưa đăng nhập, không xác định được người dùng.");
      return;
    }

    const nextStatus = device.status === "ON" ? "OFF" : "ON";
    const actionText = nextStatus === "ON" ? "BẬT" : "TẮT";
    setControlBusy(device.id);
    setDeviceError("");
    setNotice({ type: "pending", text: `Đang gửi lệnh ${actionText} thiết bị ${device.name}...` });

    try {
      const response = await fetch(`${DEVICES_API}/${device.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: nextStatus }),
      });

      const result = await response.json().catch(() => null);

      // Backend trả status "SUCCESS" hoặc "FAIL" (FAIL kèm HTTP 503)
      if (!response.ok || result?.status !== "SUCCESS") {
        throw new Error(
          result?.message || result?.error || "Không thể gửi lệnh điều khiển thiết bị."
        );
      }

      setDevices((current) =>
        current.map((item) =>
          item.id === device.id ? { ...item, status: nextStatus } : item
        )
      );
      setNotice({ type: "success", text: `Đã ${actionText} thiết bị ${device.name}` });
    } catch (e) {
      setDeviceError(e.message || "Lỗi điều khiển thiết bị.");
      setNotice({
        type: "error",
        text: `Không thể ${actionText} thiết bị ${device.name}: ${e.message || "Lỗi điều khiển thiết bị."}`,
      });
    } finally {
      setControlBusy(null);
    }
  };

  const noticeColors = {
    pending: "#4f46e5",
    success: "#16a34a",
    error: "#dc2626",
  };

  return (
    <div className="dash-page">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 1000,
            maxWidth: 360,
            padding: "12px 18px",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            background: noticeColors[notice.type],
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.25)",
          }}
        >
          {notice.text}
        </div>
      )}
      <div className="dash-layout">
        <div className="dash-col">
          <section className="dash-banner">
            <h1>Dashboard IoT 👋</h1>
            <p>Giám sát dữ liệu cảm biến được ghi nhận từ hệ thống.</p>
            {error && <p role="alert">{error}</p>}
            {loading && <p>Đang tải dữ liệu...</p>}
          </section>

          <section className="dash-stats">
            {stats.map((item) => (
              <article key={item.key} className="dash-card dash-stat">
                <div className="dash-stat-head">
                  <TonedIcon name={item.icon} tone={item.tone} />
                  <span className="dash-stat-label">{item.label}</span>
                </div>
                <div className="dash-stat-value">
                  {item.value == null ? "--" : Number(item.value).toFixed(item.key === "light" ? 0 : 1)}
                  <small>{item.unit}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="dash-card dash-chart">
            <div className="dash-chart-head">
              <div>
                <h2>Biểu đồ giám sát môi trường</h2>
                <p>Dữ liệu lịch sử từ Backend, cập nhật mỗi 2 giây</p>
              </div>
            </div>
            <EnvironmentChart rows={chartRows} />
          </section>
        </div>

        <div className="dash-col dash-col--right">
          <section className="dash-card dash-profile">
            <div className="dash-avatar">
              <span>👤</span>
              <i className="dash-avatar-dot" />
            </div>
            <div className="dash-profile-info">
              <strong>{currentUser?.name || "Người dùng"}</strong>
              <span>{currentUser?.msv ? `MSV: ${currentUser.msv}` : "Cập nhật tự động mỗi 2 giây"}</span>
            </div>
          </section>

          <section className="dash-card dash-devices">
            <h3>Điều khiển thiết bị</h3>
            <p className="dash-devices-sub">Trạng thái lấy từ Backend</p>
            {deviceError && <p role="alert" style={{ color: "red" }}>{deviceError}</p>}
            {devices.length === 0 ? (
              <p>Chưa có dữ liệu thiết bị hoặc API /api/devices chưa được triển khai.</p>
            ) : (
              <ul className="dash-device-list">
                {devices.map((device) => {
                  const config =
                    DEVICE_CONFIG[device.name?.trim().toUpperCase()] || DEFAULT_DEVICE_CONFIG;
                  return (
                    <li key={device.id} className="dash-device">
                      <TonedIcon name={config.icon} tone={config.tone} size="xl" />
                      <div className="dash-device-text">
                        <strong>{device.name}</strong>
                        <span>{device.description || device.status}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={device.status === "ON"}
                        aria-label={`Điều khiển ${device.name}`}
                        disabled={controlBusy === device.id}
                        className={`dash-switch ${device.status === "ON" ? "is-on" : ""}`}
                        onClick={() => toggleDevice(device)}
                      >
                        <i />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}