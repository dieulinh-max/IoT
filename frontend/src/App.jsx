import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import DataSensor from "./pages/DataSensor";
import ActionHistory from "./pages/ActionHistory";
import Profile from "./pages/Profile";

import BottomNavigation from "./components/BottomNavigation";

import "./styles/App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= AUTH ================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ================= MAIN ================= */}

        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/data-sensor"
          element={
            <MainLayout>
              <DataSensor />
            </MainLayout>
          }
        />

        <Route
          path="/action-history"
          element={
            <MainLayout>
              <ActionHistory />
            </MainLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <MainLayout>
              <Profile />
            </MainLayout>
          }
        />


        {/* ================= DEFAULT ================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


/*
  Layout dùng chung cho các trang chính

  Bên trái:
  BottomNavigation
  → Sidebar

  Bên phải:
  Nội dung của từng trang
*/

function MainLayout({ children }) {
  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <BottomNavigation />

      {/* PAGE CONTENT */}
      <main className="app-content">
        {children}
      </main>

    </div>
  );
}

export default App;