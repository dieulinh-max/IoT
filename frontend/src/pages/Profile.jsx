
import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import "../styles/Profile.css";

const API_URL = "http://localhost:8080/api/profile";
const STUDENT_ID = "B23DCCN481";

const PROFILE_LINKS = {
  github: {
    label: "github",
    url: "https://github.com/DieuLinh-PTIT/IoT-Project",
  },
  figma: {
    label: "figma",
    url: "https://www.figma.com/design/pMdq8HeZuH9jCAPJzDnh59/IoT1?node-id=0-1&m=draw",
  },
  postman: {
    label: "postman",
    url: "https://minhsoniloveyou-2158417.postman.co/workspace/59442d96-e740-4c11-80ee-ca134aba72cd/collection/54857062-af3ecfc0-1953-4b90-a761-b7bbda161344",
  },
  pdf: {
    label: "BaoCao",
    url: "/docs/BaoCao_B23DCCN481.pdf",
  },
};

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}?studentId=${encodeURIComponent(STUDENT_ID)}`
        );

        if (!response.ok) {
          throw new Error("Không thể tải thông tin cá nhân.");
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi khi tải Profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="profile-page">Đang tải thông tin...</div>;
  }

  if (error) {
    return (
      <div className="profile-page">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
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

  const links = [
    { label: "Github:", ...PROFILE_LINKS.github },
    { label: "Figma:", ...PROFILE_LINKS.figma },
    { label: "Postman:", ...PROFILE_LINKS.postman },
    { label: "PDF mô tả dự án:", ...PROFILE_LINKS.pdf },
  ];

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <span className="profile-avatar-icon">👩🏻</span>
            </div>

            <h1 className="profile-name">{profileData.name}</h1>

            <div className="profile-msv-badge">
              MSV: {profileData.studentId}
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

            {links.map((link) => (
              <div className="profile-info-row" key={link.label}>
                <span className="profile-label">{link.label}</span>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-link-btn"
                >
                  <span>{link.label === "PDF mô tả dự án:"
                    ? link.label + " " + link.label
                    : link.label}</span>
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
