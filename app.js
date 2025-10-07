// =====================================
// Import module yang dibutuhkan
// =====================================
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

// =====================================
// Inisialisasi aplikasi
// =====================================
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const STORAGE_PATH = process.env.STORAGE_PATH || "./storage";

// =====================================
// Middleware dasar
// =====================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// ✅ Middleware keamanan
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  })
);

// ✅ Folder publik dan storage
app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(STORAGE_PATH));

// =====================================
// Koneksi PostgreSQL
// =====================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool
  .connect()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection error:", err.message));

// =====================================
// Inisialisasi tabel database
// =====================================
const initDB = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      photo_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("✅ Users table initialized successfully");
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
  }
};
initDB();

// =====================================
// Konfigurasi Upload
// =====================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_PATH),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const isValid =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    if (isValid) cb(null, true);
    else cb(new Error("Only image files allowed (jpeg, jpg, png, gif)!"));
  },
});

// =====================================
// ROUTES
// =====================================

// ✅ Root (serve index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Check database
app.get("/api/check-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ✅ Ambil semua users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Tambah user
app.post("/api/users", upload.single("photo"), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, error: "Name and email required" });

    const photoPath = req.file ? `/storage/${req.file.filename}` : null;
    const result = await pool.query(
      "INSERT INTO users (name, email, photo_path) VALUES ($1, $2, $3) RETURNING *",
      [name, email, photoPath]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ success: false, error: "Email already exists" });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Update user
app.put("/api/users/:id", upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const current = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (current.rows.length === 0)
      return res.status(404).json({ success: false, error: "User not found" });

    const newPhoto = req.file
      ? `/storage/${req.file.filename}`
      : current.rows[0].photo_path;

    const updated = await pool.query(
      "UPDATE users SET name=$1, email=$2, photo_path=$3 WHERE id=$4 RETURNING *",
      [name || current.rows[0].name, email || current.rows[0].email, newPhoto, id]
    );

    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Hapus user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (current.rows.length === 0)
      return res.status(404).json({ success: false, error: "User not found" });

    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// Error handling
// =====================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ success: false, error: err.message });
});

// =====================================
// Jalankan server
// =====================================
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📦 Storage directory: ${STORAGE_PATH}`);
});
