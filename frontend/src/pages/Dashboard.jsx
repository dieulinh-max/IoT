import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Thermometer, Droplet, Sun, Fan, Lightbulb, Droplets } from "lucide-react";
import "../styles/Dashboard.css";

const DASHBOARD_API = "http://localhost:8080/api/dashboard";
const DEVICES_API = "http://localhost:8080/api/devices";
const REFRESH_MS = 2000;

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

function formatDateTime(value) {
  if (!value) return { date: "--", time: "--" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const parts = String(value).split("T");
    return { date: parts[0] || "--", time: (parts[1] || "--").slice(0, 8) };
  }
  return {
    date: date.toLocaleDateString("sv-SE"),
    time: date.toLocaleTimeString("vi-VN", { hour12: false }),
  };
}

function EnvironmentChart({ rows }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const width = 804;
  const height = 420;
  const left = 58;
  const right = 20;
  const top = 24;
  const bottom = 54;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const series = [
    { key: "temperature", label: "Nhiệt độ", unit: "°C", color: "#ff8a80" },
    { key: "humidity", label: "Độ ẩm", unit: "%", color: "#9350ff" },
    { key: "light", label: "Ánh sáng", unit: "Lux", color: "#fbbf24" },
  ];
  const maxValue = Math.max(
    100,
    ...rows.flatMap((r) => series.map((s) => Number(r[s.key])).filter(Number.isFinite))
  );
  const yMax = Math.ceil(maxValue / 50) * 50 || 100;
  const x = (i) => left + (rows.length <= 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW);
  const y = (v) => top + plotH - (Number(v || 0) / yMax) * plotH;
  const makePath = (key) =>
    rows.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(r[key])}`).join(" ");
  const active = rows[Math.min(activeIndex, Math.max(rows.length - 1, 0))];

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(rows.length - 1, 0)));
  }, [rows.length]);

  if (!rows.length) return <div className="dash-chart-wrap">Chưa có dữ liệu biểu đồ.</div>;

  return (
    <div className="dash-chart-wrap" style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ dữ liệu cảm biến">
        {Array.from({ length: 5 }, (_, i) => {
          const value = (yMax / 4) * i;
          const yy = y(value);
          return (
            <g key={i}>
              <line x1={left} x2={width - right} y1={yy} y2={yy} className="dash-grid-line" />
              <text x={left - 10} y={yy} textAnchor="end" dominantBaseline="middle" className="dash-ytick">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        {series.map((s) => (
          <path key={s.key} d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {rows.map((row, i) => (
          <g
            key={`${row.time}-${i}`}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => setActiveIndex(i)}
            style={{ cursor: "pointer" }}
          >
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
            {(i === 0 || i === rows.length - 1 || i === activeIndex || i % Math.ceil(rows.length / 5) === 0) && (
              <text x={x(i)} y={height - 22} textAnchor="middle" className="dash-xtime">
                {formatDateTime(row.time).time.slice(0, 5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {active && (
        <div className="dash-chart-tooltip">
          <strong>{active.time ? new Date(active.time).toLocaleString("vi-VN") : "--"}</strong>
          <div>Nhiệt độ: {active.temperature ?? "--"} °C</div>
          <div>Độ ẩm: {active.humidity ?? "--"} %</div>
          <div>Ánh sáng: {active.light ?? "--"} ADC</div>
        </div>
      )}
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

  // Thông tin người dùng lấy từ DB lúc đăng nhập
  const currentUser = useMemo(() => getStoredUser(), []);

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryResponse, chartResponse] = await Promise.all([
        fetch(`${DASHBOARD_API}/summary`),
        fetch(`${DASHBOARD_API}/chart?limit=20`),
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
    setControlBusy(device.id);
    setDeviceError("");

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
    } catch (e) {
      setDeviceError(e.message || "Lỗi điều khiển thiết bị.");
    } finally {
      setControlBusy(null);
    }
  };

  return (
    <div className="dash-page">
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
                <p>Dữ liệu lịch sử từ Backend</p>
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