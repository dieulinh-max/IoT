import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  File,
  History,
  User
} from "lucide-react";

import "../styles/BottomNavigation.css";


function BottomNavigation() {

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      path: "/data-sensor",
      label: "Data Sensor",
      icon: File
    },
    {
      path: "/action-history",
      label: "Action History",
      icon: History
    },
    {
      path: "/profile",
      label: "Profile",
      icon: User
    }
  ];


  return (
    <aside className="sidebar">

      {/* ================= LOGO ================= */}

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l9 9-9 9-9-9 9-9z" fill="currentColor" />
            <circle cx="12" cy="12" r="6" fill="#7c3aed" />
          </svg>
        </div>

        <span>
          Sensor<b>IoT</b>
        </span>

      </div>


      {/* ================= NAVIGATION ================= */}

      <nav className="sidebar-nav">

        {navItems.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}

              className={({ isActive }) =>
                `sidebar-nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >

              <Icon size={18} />

              <span>
                {item.label}
              </span>

            </NavLink>
          );

        })}

      </nav>

    </aside>
  );
}


export default BottomNavigation;