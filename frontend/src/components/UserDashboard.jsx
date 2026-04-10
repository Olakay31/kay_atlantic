import React, { useEffect, useState } from "react";

const API = "https://kay-atlantic-11.onrender.com";

export default function UserDashboard({ user, onLogout }) {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [shipments, setShipments] = useState([]);

  const statusMap = {
    "Order Received": 1,
    "Shipped from USA": 2,
    "In Transit": 3,
    "Arrived Nigeria": 4,
    "Delivered": 5,
  };

  const steps = [
    "Order Received",
    "Shipped from USA",
    "In Transit",
    "Arrived Nigeria",
    "Delivered",
  ];

  // ================= FETCH USER SHIPMENTS =================
  const fetchShipments = () => {
    fetch(`${API}/my-shipments?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setShipments(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // ================= TRACK =================
  const handleTrack = async () => {
    if (!trackingId) return;

    const cleanId = trackingId.trim().toUpperCase();

    const res = await fetch(
      `${API}/track/${cleanId}?user_id=${user.id}`
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    data.step = statusMap[data.status] || 1;

    setResult(data);
    fetchShipments();
  };

  return (
    <div className="dashboard">

      {/* NAV */}
      <div className="nav">
        <h2>🚚 AtlanticBridge Logistics</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      {/* TRACK */}
      <div className="card">
        <h2>Track Shipment</h2>

        <div className="track-box">
          <input
            placeholder="Enter Tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
          <button onClick={handleTrack}>Track</button>
        </div>

        {result && (
          <>
            <h3 className="status">{result.status}</h3>
            <p>{result.location}</p>

            {/* TIMELINE */}
            <div className="timeline">
              <div className="line">
                <div
                  className="progress"
                  style={{
                    width: `${(result.step - 1) * 25}%`,
                  }}
                ></div>
              </div>

              {steps.map((step, index) => {
                const active = index + 1 <= result.step;

                return (
                  <div key={index} className="step">
                    <div className={`circle ${active ? "active" : ""}`}>
                      {index + 1}
                    </div>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MY SHIPMENTS */}
      <div className="card">
        <h3>📦 My Shipments</h3>

        {shipments.length === 0 ? (
          <p>No shipments yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td>{s.tracking_id}</td>
                  <td>{s.status}</td>
                  <td>{s.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* STYLE */}
      <style>{`
        body { margin:0; font-family:Segoe UI }

        .dashboard {
          min-height:100vh;
          padding:20px;
          background:url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d") center/cover;
        }

        .nav {
          display:flex;
          justify-content:space-between;
          color:white;
          margin-bottom:20px;
        }

        .card {
          background:rgba(255,255,255,0.95);
          padding:20px;
          border-radius:12px;
          margin-bottom:20px;
          box-shadow:0 10px 30px rgba(0,0,0,0.2);
        }

        .track-box {
          display:flex;
          margin-top:10px;
        }

        .track-box input {
          flex:1;
          padding:12px;
        }

        .track-box button {
          padding:12px;
          background:#0a1f44;
          color:white;
          border:none;
        }

        .timeline {
          margin-top:30px;
          position:relative;
          display:flex;
          justify-content:space-between;
        }

        .line {
          position:absolute;
          top:18px;
          left:0;
          right:0;
          height:4px;
          background:#ddd;
        }

        .progress {
          height:4px;
          background:linear-gradient(90deg,#00c853,#2e7d32);
          transition:0.5s;
        }

        .step {
          text-align:center;
          z-index:2;
        }

        .circle {
          width:35px;
          height:35px;
          border-radius:50%;
          background:#ccc;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          margin:auto;
        }

        .circle.active {
          background:#00c853;
          transform:scale(1.1);
        }

        table {
          width:100%;
          border-collapse:collapse;
        }

        th, td {
          padding:10px;
          border-bottom:1px solid #ddd;
        }
      `}</style>

    </div>
  );
}