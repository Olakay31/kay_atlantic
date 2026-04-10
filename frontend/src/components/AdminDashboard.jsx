import React, { useEffect, useState } from "react";

const API = "https://kay-atlantic-11.onrender.com";

export default function AdminDashboard({ onLogout }) {

  // ================= STATE =================
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState([]);

  const [status, setStatus] = useState("Order Received");
  const [location, setLocation] = useState("");

  const [batchId, setBatchId] = useState("");
  const [assignEmail, setAssignEmail] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  // ================= FETCH SHIPMENTS =================
  const fetchShipments = () => {
    fetch(`${API}/shipments`)
      .then((res) => res.json())
      .then((data) => setShipments(Array.isArray(data) ? data : []))
      .catch(() => setShipments([]));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // ================= FETCH USERS =================
  useEffect(() => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]));
  }, []);

  // ================= SELECT =================
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // ================= CREATE =================
  const createShipment = async () => {
    if (!status || !location) {
      return alert("Fill all fields");
    }

    if (!selectedUser) {
      return alert("Select a user");
    }

    try {
      const res = await fetch(`${API}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          location,
          user_id: selectedUser,
        }),
      });

      const data = await res.json();

      alert(`Created: ${data.tracking_id}`);

      setLocation("");
      setSelectedUser("");

      fetchShipments();
    } catch {
      alert("Error creating shipment");
    }
  };

  // ================= UPDATE =================
  const updateShipment = async (tracking_id, newStatus, newLocation) => {
    await fetch(`${API}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking_id,
        status: newStatus,
        location: newLocation,
      }),
    });

    fetchShipments();
  };

  // ================= ASSIGN =================
  const assignBatch = async () => {
    if (!batchId || selected.length === 0 || !assignEmail) {
      return alert("Enter batch ID, email and select shipments");
    }

    await fetch(`${API}/shipments/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch_id: batchId,
        tracking_ids: selected,
        email: assignEmail,
      }),
    });

    alert("Batch assigned");
    setSelected([]);
    fetchShipments();
  };

  return (
    <div className="admin">

      <div className="overlay">

        {/* NAV */}
        <div className="nav">
          <h2>🚀 AtlanticBridge Control Center</h2>
          <button onClick={onLogout}>Logout</button>
        </div>

        {/* CREATE */}
        <div className="card">
          <h3>Create Shipment</h3>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Order Received</option>
            <option>Shipped from USA</option>
            <option>In Transit</option>
            <option>Arrived Nigeria</option>
            <option>Delivered</option>
          </select>

          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {/* USER DROPDOWN */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <button onClick={createShipment}>Create</button>
        </div>

        {/* ASSIGN */}
        <div className="card">
          <h3>Assign Shipments</h3>

          <input
            placeholder="Batch ID"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          />

          <input
            placeholder="User Email"
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
          />

          <button onClick={assignBatch}>Assign</button>
        </div>

        {/* TABLE */}
        <div className="card">
          <h3>All Shipments</h3>

          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Tracking</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.tracking_id)}
                      onChange={() => toggleSelect(s.tracking_id)}
                    />
                  </td>

                  <td>{s.tracking_id}</td>

                  <td>
                    <select
                      value={s.status}
                      onChange={(e) =>
                        updateShipment(
                          s.tracking_id,
                          e.target.value,
                          s.location
                        )
                      }
                    >
                      <option>Order Received</option>
                      <option>Shipped from USA</option>
                      <option>In Transit</option>
                      <option>Arrived Nigeria</option>
                      <option>Delivered</option>
                    </select>
                  </td>

                  <td>
                    <input
                      value={s.location}
                      onChange={(e) =>
                        updateShipment(
                          s.tracking_id,
                          s.status,
                          e.target.value
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* STYLE (UNCHANGED) */}
      <style>{`
        .admin {
          min-height:100vh;
          padding:20px;
          background: url("https://images.unsplash.com/photo-1553413077-190dd305871c") center/cover;
        }

        .overlay {
          background: rgba(0,0,0,0.7);
          min-height:100vh;
          padding:20px;
        }

        .nav {
          display:flex;
          justify-content:space-between;
          margin-bottom:20px;
          color:white;
        }

        .card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-radius:12px;
          padding:20px;
          margin-bottom:20px;
        }

        input, select {
          display:block;
          margin:10px 0;
          padding:10px;
          width:100%;
        }

        button {
          padding:10px;
          background:#0a1f44;
          color:white;
          border:none;
          cursor:pointer;
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