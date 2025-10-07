const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure storage directory exists
const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}
app.use('/storage', express.static(STORAGE_PATH));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Create users table if not exists
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      photo_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('Users table initialized');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

initDB();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now,
      storage_path: STORAGE_PATH
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Create new user
app.post('/api/users', upload.single('photo'), async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    const photoPath = req.file ? `/storage/${req.file.filename}` : null;
    
    const result = await pool.query(
      'INSERT INTO users (name, email, photo_path) VALUES ($1, $2, $3) RETURNING *',
      [name, email, photoPath]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating user:', err);
    
    // Delete uploaded file if database insert fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Update user
app.put('/api/users/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    // Get current user data
    const currentUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const photoPath = req.file ? `/storage/${req.file.filename}` : currentUser.rows[0].photo_path;
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, photo_path = $3 WHERE id = $4 RETURNING *',
      [name || currentUser.rows[0].name, email || currentUser.rows[0].email, photoPath, id]
    );
    
    // Delete old photo if new one uploaded
    if (req.file && currentUser.rows[0].photo_path) {
      const oldPhotoPath = path.join(__dirname, currentUser.rows[0].photo_path);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user data to delete photo
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user from database
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Delete photo file
    if (user.rows[0].photo_path) {
      const photoPath = path.join(__dirname, user.rows[0].photo_path);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Storage path: ${STORAGE_PATH}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
  });
});