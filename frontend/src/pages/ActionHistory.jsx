import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock, X, Fan, Lightbulb, Droplets, ArrowUpDown } from "lucide-react";
import "../styles/ActionHistory.css";

const API = "http://localhost:8080/api/action-history";
const ROWS_OPTIONS = [10, 20, 50, 100];

const DEVICE_OPTIONS = [
  { value: "all", label: "Tất cả thiết bị" },
  { value: "Light", label: "Light" },
  { value: "Fan", label: "Fan" },
  { value: "Humidifier", label: "Humidifier" },
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

const getPages = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "dots-end", total];
  if (current >= total - 2) return [1, "dots-start", total - 2, total - 1, total];
  return [1, "dots-start", current, "dots-end", total];
};

const parseRange = (text) => {
  const value = text.trim();
  const day = value.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (day) return { startTime: `${day[1]}T00:00:00`, endTime: `${day[1]}T23:59:59` };
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*-\s*(?:(\d{4}-\d{2}-\d{2})[ T])?(\d{2}:\d{2}(?::\d{2})?)$/
  );
  if (!match) return null;
  const seconds = (time, fallback) => (time.length === 5 ? `${time}:${fallback}` : time);
  const startTime = `${match[1]}T${seconds(match[2], "00")}`;
  const endTime = `${match[3] || match[1]}T${seconds(match[4], "59")}`;
  return new Date(startTime) <= new Date(endTime) ? { startTime, endTime } : null;
};

const formatTime = (value) => (value ? String(value).replace("T", " ").replace("Z", "").slice(0, 19) : "--");
const displayAction = (value) => ({ ON: "Bật", OFF: "Tắt" }[value] || value || "--");
const displayStatus = (value) => ({ SUCCESS: "Thành công", PENDING: "Chờ xác nhận", FAIL: "Thất bại" }[value] || value || "--");

function ActionHistory() {
  // Bộ lọc đang chọn tạm thời trên giao diện (chưa kích hoạt API)
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateInput, setDateInput] = useState("");
  const [dateError, setDateError] = useState(false);

  // Bộ lọc chính thức áp dụng khi bấm Tìm kiếm
  const [appliedFilters, setAppliedFilters] = useState({
    device: "all",
    action: "all",
    status: "all",
    range: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = useMemo(() => getStoredUser(), []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("sensorIoTToken") || sessionStorage.getItem("sensorIoTToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: String(rowsPerPage),
      });

      if (appliedFilters.device !== "all") params.set("deviceId", appliedFilters.device);
      if (appliedFilters.action !== "all") params.set("action", appliedFilters.action);
      if (appliedFilters.status !== "all") params.set("status", appliedFilters.status);
      if (appliedFilters.range) {
        params.set("startTime", appliedFilters.range.startTime);
        params.set("endTime", appliedFilters.range.endTime);
      }

      const response = await fetch(`${API}?${params.toString()}`, { headers });
      if (!response.ok) throw new Error("Không tải được lịch sử điều khiển.");
      const data = await response.json();
      setPageData({
        content: Array.isArray(data) ? data : data.content || [],
        totalElements: data.totalElements ?? data.content?.length ?? 0,
        totalPages: data.totalPages ?? 1,
      });
    } catch (e) {
      setError(`${e.message || "Lỗi kết nối Backend."} Kiểm tra API ${API}.`);
      setPageData({ content: [], totalElements: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, appliedFilters]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = () => {
    let range = null;
    if (dateInput.trim()) {
      range = parseRange(dateInput);
      if (!range) {
        setDateError(true);
        return;
      }
    }
    setDateError(false);

    setAppliedFilters({
      device: deviceFilter,
      action: actionFilter,
      status: statusFilter,
      range: range,
    });
    setCurrentPage(1);
  };

  const clearDate = () => {
    setDateInput("");
    setDateError(false);
  };

  const renderDeviceIcon = (item) => {
    const name = String(item.deviceName || item.device || "").toLowerCase();
    if (name.includes("quạt") || name.includes("fan"))
      return <span className="device-icon-box device-icon-fan"><Fan size={14} /></span>;
    if (name.includes("đèn") || name.includes("light") || name.includes("led"))
      return <span className="device-icon-box device-icon-light"><Lightbulb size={14} /></span>;
    if (name.includes("sương") || name.includes("mist") || name.includes("humidifier") || name.includes("humidity"))
      return <span className="device-icon-box device-icon-mist"><Droplets size={14} /></span>;
    return <span className="device-icon-box device-icon-default"><ArrowUpDown size={14} /></span>;
  };

  const badgeClass = (value) => {
    if (value === "ON" || value === "Bật") return "badge-on";
    if (value === "OFF" || value === "Tắt") return "badge-off";
    if (value === "PENDING" || value === "Chờ xác nhận") return "badge-pending";
    return "";
  };

  const rows = pageData.content;
  const totalPages = Math.max(1, pageData.totalPages || 1);
  const pages = getPages(currentPage, totalPages);

  return (
    <div className="action-history-page">
      <div className="action-header">
        <section className="action-banner">
          <h1>Lịch sử điều khiển thiết bị</h1>
          <p>Theo dõi hành động bật/tắt và trạng thái xác nhận từ thiết bị.</p>
        </section>
        <section className="action-user">
          <div className="action-avatar">
            <span>👤</span>
            <i className="action-avatar-dot" />
          </div>
          <div className="action-user-info">
            <strong>{currentUser?.name || "Người dùng"}</strong>
            <small>{currentUser?.msv ? `MSV: ${currentUser.msv}` : "Thông tin hệ thống"}</small>
          </div>
        </section>
      </div>

      <section className="action-filter-card">
        <div className="action-filter-group">
          {/* Dropdown Thiết bị */}
          <div className="action-select">
            <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
              {DEVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>

          {/* Dropdown Hành động */}
          <div className="action-select">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="all">Tất cả hành động</option>
              <option value="ON">Bật</option>
              <option value="OFF">Tắt</option>
            </select>
            <ChevronDown size={16} />
          </div>

          {/* Dropdown Trạng thái */}
          <div className="action-select">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="FAIL">Thất bại</option>
            </select>
            <ChevronDown size={16} />
          </div>

          {/* Ô nhập ngày/giờ */}
          <div className={`action-date-input ${dateError ? "action-date-error" : ""}`}>
            <Clock size={16} />
            <input
              value={dateInput}
              onChange={(e) => {
                setDateInput(e.target.value);
                setDateError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="2026-10-03 13:18:00 - 13:19:00"
              aria-label="Khoảng thời gian"
              aria-invalid={dateError}
            />
            {dateInput && (
              <button
                type="button"
                className="action-date-clear"
                onClick={clearDate}
                aria-label="Xóa thời gian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Nút Tìm kiếm */}
          <button type="button" className="action-search-btn" onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>
      </section>

      <section className="action-card">
        {error && <p role="alert" className="action-error-msg">{error}</p>}
        <div className="action-table-container">
          <table className="action-table">
            <thead>
              <tr>
                <th className="th-user-id"><div className="th-content">USER ID <ArrowUpDown size={13} /></div></th>
                <th className="th-device"><div className="th-content">TÊN THIẾT BỊ <ArrowUpDown size={13} /></div></th>
                <th className="th-action"><div className="th-content">HÀNH ĐỘNG <ArrowUpDown size={13} /></div></th>
                <th className="th-status"><div className="th-content">TRẠNG THÁI <ArrowUpDown size={13} /></div></th>
                <th className="th-time"><div className="th-content">THỜI GIAN THỰC THI <ArrowUpDown size={13} /></div></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="action-empty">Đang tải dữ liệu...</td></tr>
              ) : rows.length ? (
                rows.map((item) => {
                  const deviceName = item.deviceName || item.device?.name || item.device || "--";
                  const action = item.action;
                  const status = item.status;
                  // Lấy trực tiếp từ userId trả về bởi ActionHistoryResponse
                  const displayUserId = item.userId ?? item.user_id ?? currentUser?.id ?? "--";

                  return (
                    <tr key={item.id}>
                      <td className="action-user-id-cell">
                        <span className="user-id-badge">#{displayUserId}</span>
                      </td>
                      <td>
                        <div className="device-cell">
                          {renderDeviceIcon({ ...item, deviceName })}
                          <span className="device-name">{deviceName}</span>
                        </div>
                      </td>
                      <td><span className={`action-badge ${badgeClass(action)}`}>{displayAction(action)}</span></td>
                      <td><span className={`action-badge ${badgeClass(status)}`}>{displayStatus(status)}</span></td>
                      <td className="action-time-cell">{formatTime(item.time || item.updatedAt || item.createdAt)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="5" className="action-empty">Không có lịch sử hành động nào được ghi nhận</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="action-footer">
          <div className="action-total-wrap">
            <span>Hiển thị:</span>
            <div className="action-rows-select">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {ROWS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <span className="action-total-text">Tổng: <strong>{pageData.totalElements}</strong> lượt thực thi</span>
          </div>

          <div className="action-pagination">
            <button
              type="button"
              className="action-nav-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ← Trước
            </button>
            {pages.map((page, i) =>
              typeof page === "string" ? (
                <span key={`${page}-${i}`} className="action-dots">...</span>
              ) : (
                <button
                  type="button"
                  key={page}
                  className={`action-page-btn ${currentPage === page ? "action-page-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              className="action-nav-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Sau →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ActionHistory;