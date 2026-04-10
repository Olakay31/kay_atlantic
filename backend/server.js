const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const SECRET = "kay_atlantic_secret";

app.use(express.json());
app.use(cors());

// ================= DATABASE =================

// parse manually instead of using raw URL
const db = mysql.createConnection({
  host: "metro.proxy.rlwy.net",
  user: "root",
  password: "kay_atlantic",
  database: "railway",
  port: 40842,
});

db.connect((err) => {
  if (err) {
    console.error("DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});


// ================= SOCKET =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

// ================= STATUS MAP =================
const statusMap = {
  "Order Received": 1,
  "Shipped from USA": 2,
  "In Transit": 3,
  "Arrived Nigeria": 4,
  "Delivered": 5,
};

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("Backend running...");
});

// ================= TRACK =================
app.get("/api/track/:id", (req, res) => {
  const id = req.params.id.trim().toUpperCase();
  const user_id = req.query.user_id;

  db.query(
    "SELECT * FROM shipments WHERE UPPER(tracking_id) = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: "Tracking ID not found" });
      }

      const shipment = results[0];

      shipment.step =
        statusMap[shipment.status] || Number(shipment.step || 1);

      if (user_id) {
        db.query(
          "UPDATE shipments SET user_id = ? WHERE tracking_id = ?",
          [user_id, id]
        );
      }

      res.json(shipment);
    }
  );
});

// ================= USER SHIPMENTS =================
app.get("/api/my-shipments", (req, res) => {
  const { user_id } = req.query;

  db.query(
    "SELECT * FROM shipments WHERE user_id = ? ORDER BY id DESC",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(results);
    }
  );
});

// ================= ALL SHIPMENTS =================
app.get("/api/shipments", (req, res) => {
  db.query("SELECT * FROM shipments", (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

// ================= CREATE (AUTO ID) =================
app.post("/api/create", (req, res) => {
  const { status, location, user_id } = req.body;

  if (!status || !location) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.query(
    "SELECT id FROM shipments ORDER BY id DESC LIMIT 1",
    (err, result) => {
      let nextId = 1;

      if (result.length > 0) {
        nextId = result[0].id + 1;
      }

      const tracking_id = `KAY${String(nextId).padStart(4, "0")}`;
      const step = statusMap[status] || 1;

      db.query(
        "INSERT INTO shipments (tracking_id, status, location, step, user_id) VALUES (?, ?, ?, ?, ?)",
        [tracking_id, status, location, step, user_id || null],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          io.emit("shipment_updated");

          res.json({ message: "Created", tracking_id });
        }
      );
    }
  );
});
// ================= UPDATE (FIXED) =================
app.put("/api/update", (req, res) => {
  const { tracking_id, status, location } = req.body;

  if (!tracking_id) {
    return res.status(400).json({ message: "Tracking ID required" });
  }

  const step = statusMap[status] || 1;

  db.query(
    "UPDATE shipments SET status = ?, location = ?, step = ? WHERE tracking_id = ?",
    [status, location, step, tracking_id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });

      io.emit("shipment_updated");

      res.json({ message: "Updated" });
    }
  );
});

// ===============ADD USERS API==================
app.get("/api/users", (req, res) => {
  db.query(
    "SELECT id, name, email FROM users",
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(results);
    }
  );
});

// ================= BATCH ASSIGN =================
app.put("/api/shipments/assign", (req, res) => {
  const { batch_id, tracking_ids, email, status, location } = req.body;

  if (!tracking_ids || tracking_ids.length === 0) {
    return res.status(400).json({ message: "No shipments selected" });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    (err, userResult) => {
      if (!userResult || userResult.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user_id = userResult[0].id;
      const step = statusMap[status] || 1;

      const query = `
        UPDATE shipments 
        SET batch_id = ?, user_id = ?, status = ?, location = ?, step = ?
        WHERE tracking_id IN (${tracking_ids.map(() => "?").join(",")})
      `;

      db.query(
        query,
        [batch_id, user_id, status, location, step, ...tracking_ids],
        (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          io.emit("shipment_updated");

          res.json({
            message: "Batch updated",
            affectedRows: result.affectedRows,
          });
        }
      );
    }
  );
});

// ================= BATCH LIST =================
app.get("/api/batches", (req, res) => {
  db.query(
    "SELECT batch_id, COUNT(*) as total FROM shipments WHERE batch_id IS NOT NULL GROUP BY batch_id",
    (err, results) => {
      res.json(results);
    }
  );
});

// ================= AUTH =================
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [name, email, hash],
      (err) => {
        if (err) return res.status(500).json({ message: err.message });

        res.json({ message: "Registered successfully" });
      }
    );
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, match) => {
        if (!match) {
          return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user.id }, SECRET, {
          expiresIn: "1d",
        });

        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
          },
        });
      });
    }
  );
});

// ================= START =================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});