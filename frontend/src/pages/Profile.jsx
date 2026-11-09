
import React, { useCallback, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import "../styles/Profile.css";

const API_URL = "http://localhost:8080/api/profile";

const PROFILE_LINKS = [
  {
    label: "Github:",
    text: "github",
    url: "https://github.com/dieulinh-max/IoT",
  },
  {
    label: "Figma:",
    text: "figma",
    url: "https://www.figma.com/design/pMdq8HeZuH9jCAPJzDnh59/IoT1?node-id=0-1&m=draw",
  },
  {
    label: "Postman:",
    text: "postman",
    url: "https://documenter.getpostman.com/view/54857062/2sBYHURebS",
  },
  {
    label: "PDF mô tả dự án:",
    text: "BaoCao",
    url: "https://docs.google.com/document/d/1TXR0Wd-vAHg5NkOI1CESGBNqrZC5ocJA/edit",
  },
];

// Đọc người dùng đã lưu khi đăng nhập
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

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const user = getStoredUser();
      const token = user?.token;

      if (!token) {
        throw new Error(
          "Không tìm thấy JWT. Vui lòng đăng xuất và đăng nhập lại."
        );
      }

      // Ưu tiên mã sinh viên của tài khoản đã đăng nhập
      const studentId = user.msv;

      if (!studentId) {
        throw new Error(
          "Không tìm thấy mã sinh viên trong thông tin đăng nhập."
        );
      }

      const params = new URLSearchParams({
        studentId: studentId,
      });

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = `Không thể tải thông tin cá nhân (HTTP ${response.status}).`;

        try {
          const body = await response.json();
          message = body.message || body.error || message;
        } catch {
          // Phản hồi không phải JSON
        }

        throw new Error(message);
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi tải Profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="profile-page">
        Đang tải thông tin...
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <p role="alert">{error}</p>
        <button type="button" onClick={fetchProfile}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        Không có dữ liệu người dùng.
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <span className="profile-avatar-icon">👤</span>
            </div>

            <h1 className="profile-name">
              {profileData.name || "Chưa cập nhật"}
            </h1>

            <div className="profile-msv-badge">
              MSV: {profileData.studentId || getStoredUser()?.msv || "--"}
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-info-list">
            <div className="profile-info-row">
              <span className="profile-label">Ngày sinh:</span>
              <span className="profile-value-bold">
                {profileData.dob || "Chưa cập nhật"}
              </span>
            </div>

            {PROFILE_LINKS.map((link) => (
              <div className="profile-info-row" key={link.label}>
                <span className="profile-label">{link.label}</span>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-link-btn"
                >
                  <span>{link.text}</span>
                  <ArrowUpRight size={15} />
                </a>
              </div>
            ))}

            <div className="profile-faculty-box">
              <span className="profile-faculty-dot" />
              <span>
                Học viện Công nghệ Bưu chính Viễn thông - Khoa Công nghệ Thông tin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
