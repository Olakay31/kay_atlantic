import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      // ✅ Save user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful!");

      // ✅ REDIRECT BASED ON ROLE
      setTimeout(() => {
        onLogin();

        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 500);

    } catch (err) {
      console.error(err);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setMessage("Account created! You can now login.");
      setTab("login");

    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // ================= FORGOT =================
  const handleForgot = async () => {
    if (!email) {
      setError("Enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error sending reset");
        return;
      }

      setMessage("Reset link/token sent!");

    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <style>{`
        .login-container {
          display: flex;
          height: 100vh;
          font-family: "Segoe UI", sans-serif;
        }

        .login-left {
          flex: 1;
          background:
            linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)),
            url("/hero.jpg");
          background-size: cover;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
        }

        .card {
          width: 380px;
          padding: 40px;
          border-radius: 15px;
          background: white;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tabs button {
          flex: 1;
          padding: 10px;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          background: #eee;
        }

        .tabs button.active {
          background: #ffb400;
          font-weight: bold;
        }

        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        button.main {
          width: 100%;
          padding: 12px;
          background: #ffb400;
          border: none;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
        }

        .error { color: red; }
        .message { color: green; }
      `}</style>

      {/* LEFT */}
      <div className="login-left">
        <h1>AtlanticBridge</h1>
        <h2>Logistics</h2>
        <p>Track and manage shipments seamlessly.</p>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="card">

          <div className="tabs">
            <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
              Login
            </button>
            <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
              Register
            </button>
            <button className={tab === "forgot" ? "active" : ""} onClick={() => setTab("forgot")}>
              Forgot
            </button>
          </div>

          {tab === "login" && (
            <>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="main" onClick={handleLogin}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </>
          )}

          {tab === "register" && (
            <>
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="main" onClick={handleRegister}>
                {loading ? "Creating..." : "Register"}
              </button>
            </>
          )}

          {tab === "forgot" && (
            <>
              <input placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="main" onClick={handleForgot}>
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {message && <p className="message">{message}</p>}

        </div>
      </div>
    </div>
  );
}