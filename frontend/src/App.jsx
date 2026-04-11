import React, { useEffect, useState } from "react";
import Login from "./Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";

import {
  FaBox,
  FaShip,
  FaPlane,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

const API = "https://kay-atlantic-11.onrender.com/api";


// ✅ MOVE SOCKET INSIDE COMPONENT
export default function App() {
  const [user, setUser] = useState(null);
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);



const socket = io("https://kay-atlantic-11.onrender.com", {
  transports: ["websocket"],
});

  // ================= LOAD USER =================
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) setUser(savedUser);
  }, []);

  // ================= SOCKET =================
  useEffect(() => {
    socket.on("shipment_updated", () => {
      if (trackingId) handleTrack();
    });

    return () => socket.disconnect();
  }, [trackingId]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleTrack = async () => {
    if (!trackingId) return alert("Enter tracking ID");

    const cleanId = trackingId.trim().toUpperCase();

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API}/track/${cleanId}`);
      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.message });
        return;
      }

      setResult(data);
    } catch {
      setResult({ error: "Server error" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Order Received", icon: <FaBox /> },
    { label: "Shipped from USA", icon: <FaShip /> },
    { label: "In Transit", icon: <FaPlane /> },
    { label: "Arrived Nigeria", icon: <FaMapMarkerAlt /> },
    { label: "Delivered", icon: <FaCheckCircle /> },
  ];

  // ================= LOGIN =================
  if (!user) {
    return (
      <Login onLogin={() => setUser(JSON.parse(localStorage.getItem("user")))} />
    );
  }

  // ================= TRACK PAGE =================
  const TrackingPage = () => (
    <div>

      <nav className="navbar">
        <h2>AtlanticBridge Logistics</h2>

        <div className="nav-right">
          <FaUserCircle size={24} />
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="overlay-center">
          <div className="card">
            <h2>Track Your Shipment</h2>

            <div className="track-box">
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter Tracking ID"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
              <button onClick={handleTrack}>
                {loading ? "Tracking..." : "Track"}
              </button>
            </div>

            {result?.error && <p className="error">{result.error}</p>}

            {result && !result.error && (
              <>
                <h3>{result.status}</h3>
                <p>{result.location}</p>

                <div className="timeline">
                  <div className="line">
                    <div
                      className="progress"
                      style={{ width: `${(result.step - 1) * 25}%` }}
                    ></div>
                  </div>

                  {steps.map((step, i) => {
                    const active = i + 1 <= result.step;
                    return (
                      <div key={i} className="timeline-step">
                        <div className={`circle ${active ? "active" : ""}`}>
                          {step.icon}
                        </div>
                        <p>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* KEEP ALL YOUR SECTIONS (UNCHANGED) */}

      <style>{`
        body { margin:0; font-family:Segoe UI }

        .navbar {
          display:flex;
          justify-content:space-between;
          padding:15px 30px;
          background:#0a1f44;
          color:white;
        }

        .nav-right {
          display:flex;
          align-items:center;
          gap:15px;
        }

        .logout-btn {
          background:#ffb400;
          border:none;
          padding:8px 12px;
          cursor:pointer;
        }

        .hero {
          height:80vh;
          background:url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d") center/cover;
        }

        .overlay-center {
          height:100%;
          display:flex;
          justify-content:center;
          align-items:center;
          background:rgba(0,0,0,0.6);
        }

        .card {
          background:white;
          padding:30px;
          border-radius:12px;
          width:500px;
          text-align:center;
        }

        .track-box { display:flex }
        .track-box input { flex:1; padding:10px }
        .track-box button { background:#ffb400; border:none }

        .timeline {
          margin-top:20px;
          display:flex;
          justify-content:space-between;
        }

        .circle {
          width:40px;
          height:40px;
          border-radius:50%;
          background:#ccc;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
        }

        .circle.active { background:#00c853 }

        .error { color:red }
      `}</style>

    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<TrackingPage />} />

      <Route
        path="/dashboard"
        element={<UserDashboard user={user} onLogout={handleLogout} />}
      />

      <Route
        path="/admin"
        element={
          user.role === "admin"
            ? <AdminDashboard onLogout={handleLogout} />
            : <Navigate to="/" />
        }
      />
    </Routes>
  );
}
