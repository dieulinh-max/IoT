
import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, Clock, X } from "lucide-react";
import "../styles/DataSensor.css";

const API = "http://localhost:8080/api/sensor-data";
const ROWS_OPTIONS = [10, 20, 50, 100];

// Tạo danh sách trang
const getPages = (current, total) => {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
        return [1, 2, 3, "dots-end", total];
    }

    if (current >= total - 2) {
        return [1, "dots-start", total - 2, total - 1, total];
    }

    return [1, "dots-start", current, "dots-end", total];
};

// Kiểm tra ngày có hợp lệ hay không
const isValidDate = (value) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

// Chuẩn hóa một mốc thời gian.
// Hỗ trợ:
// YYYY-MM-DD
// YYYY-MM-DD HH
// YYYY-MM-DD HH:mm
// YYYY-MM-DD HH:mm:ss
// HH:mm hoặc HH:mm:ss nếu đã có ngày bắt đầu để suy ra ngày
const normalizeTimePoint = (raw, fallbackDate = null) => {
    const value = raw.trim().replace("T", " ");

    const dateTimeMatch = value.match(
        /^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2})(?::(\d{2})(?::(\d{2}))?)?)?$/
    );

    if (dateTimeMatch) {
        const [, date, hour, minute, second] = dateTimeMatch;

        if (!isValidDate(date)) return null;

        if (hour === undefined) {
            return date;
        }

        if (Number(hour) > 23) return null;
        if (minute !== undefined && Number(minute) > 59) return null;
        if (second !== undefined && Number(second) > 59) return null;

        let result = `${date} ${hour}`;

        if (minute !== undefined) {
            result += `:${minute}`;
        }

        if (second !== undefined) {
            result += `:${second}`;
        }

        return result;
    }

    // Cho phép mốc kết thúc chỉ nhập giờ khi ngày đã được xác định.
    const timeMatch = value.match(
        /^(\d{2})(?::(\d{2})(?::(\d{2}))?)?$/
    );

    if (timeMatch && fallbackDate && isValidDate(fallbackDate)) {
        const [, hour, minute, second] = timeMatch;

        if (Number(hour) > 23) return null;
        if (minute !== undefined && Number(minute) > 59) return null;
        if (second !== undefined && Number(second) > 59) return null;

        let result = `${fallbackDate} ${hour}`;

        if (minute !== undefined) {
            result += `:${minute}`;
        }

        if (second !== undefined) {
            result += `:${second}`;
        }

        return result;
    }

    return null;
};

// Đọc ô thời gian và tách thành startTime, endTime.
// Chấp nhận một mốc hoặc một khoảng thời gian có dấu " - ".
const parseRange = (text) => {
    const value = text.trim();

    if (!value) {
        return {
            startTime: null,
            endTime: null
        };
    }

    const parts = value.split(/\s+-\s+/);

    // Chỉ nhập một mốc: để backend tự xác định hết ngày/giờ/phút/giây.
    if (parts.length === 1) {
        const startTime = normalizeTimePoint(parts[0]);

        if (!startTime) return null;

        return {
            startTime,
            endTime: null
        };
    }

    // Chỉ chấp nhận một dấu phân cách khoảng thời gian.
    if (parts.length !== 2) {
        return null;
    }

    const startTime = normalizeTimePoint(parts[0]);

    if (!startTime) return null;

    // Nếu mốc kết thúc chỉ có giờ, lấy ngày từ mốc bắt đầu.
    const dateMatch = startTime.match(/^(\d{4}-\d{2}-\d{2})/);
    const fallbackDate = dateMatch ? dateMatch[1] : null;

    const endTime = normalizeTimePoint(parts[1], fallbackDate);

    if (!endTime) return null;

    return {
        startTime,
        endTime
    };
};

// Định dạng thời gian hiển thị
const formatTime = (value) => {
    if (!value) return "--";

    return String(value)
        .replace("T", " ")
        .replace("Z", "")
        .slice(0, 19);
};

function DataSensor() {
    // Các bộ lọc đang được chọn trên giao diện (chưa áp dụng)
    const [sensorName, setSensorName] = useState("all");
    const [dateInput, setDateInput] = useState("");

    // Chỉ cập nhật khi nhấn nút Tìm kiếm
    const [appliedFilters, setAppliedFilters] = useState({
        sensorName: "all",
        startTime: null,
        endTime: null
    });

    const [dateError, setDateError] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [pageData, setPageData] = useState({
        content: [],
        totalElements: 0,
        totalPages: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Tải dữ liệu bằng các bộ lọc ĐÃ ÁP DỤNG.
    // Không phụ thuộc vào sensorName hoặc dateInput đang nhập.
    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: String(currentPage - 1),
                size: String(rowsPerPage)
            });

            if (appliedFilters.sensorName !== "all") {
                params.set("sensorName", appliedFilters.sensorName);
            }

            if (appliedFilters.startTime) {
                params.set("startTime", appliedFilters.startTime);
            }

            if (appliedFilters.endTime) {
                params.set("endTime", appliedFilters.endTime);
            }

            const response = await fetch(
                `${API}?${params.toString()}`
            );

            if (!response.ok) {
                let message = "Không tải được dữ liệu cảm biến.";

                try {
                    const body = await response.json();
                    message = body.error || body.message || message;
                } catch {
                    // Phản hồi không có JSON.
                }

                throw new Error(message);
            }

            const data = await response.json();

            setPageData({
                content: Array.isArray(data)
                    ? data
                    : (data.content || []),
                totalElements:
                    data.totalElements ?? data.content?.length ?? 0,
                totalPages: data.totalPages ?? 1
            });
        } catch (e) {
            setError(
                e.message || "Không kết nối được Backend."
            );

            setPageData({
                content: [],
                totalElements: 0,
                totalPages: 0
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, appliedFilters]);

    // Tải lần đầu, hoặc tải lại khi bộ lọc đã áp dụng / phân trang thay đổi.
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Chỉ áp dụng các trường lọc khi nhấn Tìm kiếm.
    const handleSearch = () => {
        let range;

        if (dateInput.trim()) {
            range = parseRange(dateInput);

            if (!range) {
                setDateError(true);
                setError(
                    "Thời gian không hợp lệ. Hãy nhập YYYY-MM-DD, " +
                    "YYYY-MM-DD HH:mm[:ss] hoặc một khoảng thời gian."
                );
                return;
            }
        } else {
            range = {
                startTime: null,
                endTime: null
            };
        }

        setDateError(false);
        setError("");
        setCurrentPage(1);

        setAppliedFilters({
            sensorName,
            startTime: range.startTime,
            endTime: range.endTime
        });
    };

    // Chỉ xóa nội dung ô nhập, chưa áp dụng bộ lọc mới.
    const handleClearDate = () => {
        setDateInput("");
        setDateError(false);
    };

    const rows = pageData.content;
    const totalPages = Math.max(1, pageData.totalPages || 1);
    const pages = getPages(currentPage, totalPages);

    const getValueClass = (sensor) => {
        const name = String(sensor || "").toLowerCase();

        if (
            name.includes("temperature") ||
            name.includes("nhiệt")
        ) {
            return "sensor-value-temperature";
        }

        if (
            name.includes("humidity") ||
            name.includes("ẩm")
        ) {
            return "sensor-value-humidity";
        }

        if (
            name.includes("light") ||
            name.includes("sáng")
        ) {
            return "sensor-value-light";
        }

        return "";
    };

    return (
        <div className="data-sensor-page">
            <div className="data-header">
                <section className="data-banner">
                    <h1>Lịch sử dữ liệu cảm biến</h1>
                    <p>
                        Xem và lọc số liệu cảm biến được lưu
                        trong cơ sở dữ liệu.
                    </p>
                </section>

                <section className="data-user">
                    <div className="data-avatar">
                        <span>👤</span>
                        <i className="data-avatar-dot" />
                    </div>

                    <div className="data-user-info">
                        <strong>SensorIoT</strong>
                        <small>Thông tin hệ thống</small>
                    </div>
                </section>
            </div>

            <section className="data-filter">
                <div className="data-select">
                    <select
                        value={sensorName}
                        onChange={(e) => setSensorName(e.target.value)}
                        aria-label="Chọn cảm biến"
                    >
                        <option value="all">
                            -- Tất cả cảm biến --
                        </option>
                        <option value="Temperature">
                            Temperature
                        </option>
                        <option value="Humidity">
                            Humidity
                        </option>
                        <option value="Light">
                            Light
                        </option>
                    </select>

                    <ChevronDown size={16} />
                </div>

                <div
                    className={`data-date ${
                        dateError ? "data-date-error" : ""
                    }`}
                >
                    <Clock size={14} />

                    <input
                        type="text"
                        value={dateInput}
                        placeholder={
                            "2026-10-21 13:18:00 - 13:20:00"
                        }
                        aria-label="Khoảng thời gian"
                        aria-invalid={dateError}
                        title={
                            "Nhập ngày, thời điểm hoặc khoảng thời gian. " +
                            "Ví dụ: 2026-10-21 13:18"
                        }
                        onChange={(e) => {
                            setDateInput(e.target.value);
                            setDateError(false);
                            setError("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch();
                            }
                        }}
                    />

                    {dateInput && (
                        <button
                            type="button"
                            className="data-date-clear"
                            aria-label="Xóa thời gian"
                            onClick={handleClearDate}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    className="data-search"
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </button>
            </section>

            {error && (
                <p role="alert" className="data-error">
                    {error}
                </p>
            )}

            <section className="data-card">
                <div className="data-card-title">
                    <h2>Dữ liệu cảm biến</h2>
                </div>

                <div className="data-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>CẢM BIẾN</th>
                                <th>GIÁ TRỊ</th>
                                <th>THỜI GIAN ĐO</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="data-empty"
                                    >
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : rows.length ? (
                                rows.map((item) => {
                                    const name =
                                        item.sensorName ||
                                        item.sensor?.name ||
                                        item.sensor ||
                                        "--";

                                    return (
                                        <tr key={item.id}>
                                            <td className="data-id">
                                                {item.id}
                                            </td>

                                            <td>{name}</td>

                                            <td>
                                                <span
                                                    className={`data-value ${getValueClass(name)}`}
                                                >
                                                    {item.value ?? "--"}{" "}
                                                    {item.unit || ""}
                                                </span>
                                            </td>

                                            <td>
                                                {formatTime(
                                                    item.time ||
                                                    item.createdAt
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr className="data-empty-row">
                                    <td
                                        colSpan="4"
                                        className="data-empty"
                                    >
                                        Không có dữ liệu cảm biến
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="data-footer">
                    <div className="data-total">
                        <span>Hiển thị:</span>

                        <div className="data-rows-select">
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(
                                        Number(e.target.value)
                                    );
                                    setCurrentPage(1);
                                }}
                                aria-label="Số dòng mỗi trang"
                            >
                                {ROWS_OPTIONS.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown size={16} />
                        </div>

                        <span>
                            Tổng:{" "}
                            <strong>{pageData.totalElements}</strong>{" "}
                            bản ghi
                        </span>
                    </div>

                    <div className="data-pagination">
                        <button
                            type="button"
                            className="data-nav-btn"
                            disabled={currentPage <= 1 || loading}
                            onClick={() =>
                                setCurrentPage((p) => p - 1)
                            }
                        >
                            ← Trước
                        </button>

                        {pages.map((page, i) =>
                            typeof page === "string" ? (
                                <span
                                    key={`${page}-${i}`}
                                    className="data-page-dots"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    key={page}
                                    className={`data-page ${
                                        currentPage === page
                                            ? "data-page-active"
                                            : ""
                                    }`}
                                    disabled={loading}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            type="button"
                            className="data-nav-btn"
                            disabled={
                                currentPage >= totalPages || loading
                            }
                            onClick={() =>
                                setCurrentPage((p) => p + 1)
                            }
                        >
                            Sau →
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default DataSensor;
