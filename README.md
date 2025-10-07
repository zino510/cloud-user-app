# 👥 Cloud User Management System

Aplikasi manajemen pengguna sederhana dengan Node.js, Express, PostgreSQL, dan file upload ke persistent storage.

## 📋 Fitur

- ✅ CRUD (Create, Read, Delete) data pengguna
- ✅ Upload foto profil dengan validasi
- ✅ Persistent storage untuk file upload
- ✅ Koneksi PostgreSQL dengan environment variables
- ✅ Responsive UI dengan design modern
- ✅ Health check endpoint untuk monitoring
- ✅ Error handling yang komprehensif

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **File Upload**: Multer
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Deployment**: Railway / Render

---

## 📦 Instalasi Lokal

### Prerequisites

- Node.js (v18 atau lebih tinggi)
- PostgreSQL (v12 atau lebih tinggi)
- npm atau yarn

### Langkah Instalasi

1. **Clone atau buat project baru**
```bash
mkdir cloud-user-app
cd cloud-user-app
```

2. **Inisialisasi project**
```bash
npm init -y
```

3. **Install dependencies**
```bash
npm install express pg multer
npm install --save-dev nodemon
```

4. **Buat struktur folder**
```bash
mkdir public storage
```

5. **Buat file-file berikut:**
   - `app.js` (main application)
   - `public/index.html` (frontend)
   - `package.json` (dependencies)
   - `.env` (environment variables)

6. **Setup database PostgreSQL lokal**
```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE userdb;

# Keluar
\q
```

7. **Konfigurasi environment variables**

Buat file `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/userdb
STORAGE_PATH=./storage
```

8. **Jalankan aplikasi**
```bash
npm start
# atau untuk development dengan auto-reload:
npm run dev
```

9. **Akses aplikasi**
Buka browser: `http://localhost:3000`

---

## ☁️ Deploy ke Railway

### Langkah 1: Persiapan

1. **Buat akun Railway**
   - Kunjungi [railway.app](https://railway.app)
   - Sign up dengan GitHub account
   - Verifikasi email Anda

2. **Install Railway CLI (opsional)**
```bash
npm install -g @railway/cli
railway login
```

### Langkah 2: Setup Database PostgreSQL

1. **Buat Project Baru di Railway**
   - Dashboard Railway → "New Project"
   - Pilih "Provision PostgreSQL"
   - Database akan otomatis dibuat

2. **Catat Credentials Database**
   - Klik database service
   - Tab "Variables" akan menampilkan:
     - `DATABASE_URL` (sudah dalam format connection string)
     - Host, Port, User, Password, Database name

### Langkah 3: Deploy Aplikasi

**Opsi A: Deploy via GitHub**

1. **Push ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

2. **Deploy di Railway**
   - Dashboard → "New" → "GitHub Repo"
   - Pilih repository Anda
   - Railway akan auto-detect dan deploy

3. **Konfigurasi Environment Variables**
   - Klik service aplikasi Anda
   - Tab "Variables" → "Raw Editor"
   - Tambahkan:
```env
NODE_ENV=production
STORAGE_PATH=/app/storage
```
   - `DATABASE_URL` sudah otomatis ter-link dari PostgreSQL service

**Opsi B: Deploy via Railway CLI**

```bash
# Di folder project
railway init
railway link

# Deploy
railway up

# Tambah environment variables
railway variables set NODE_ENV=production
railway variables set STORAGE_PATH=/app/storage
```

### Langkah 4: Setup Persistent Storage

1. **Buat Volume di Railway**
   - Klik service aplikasi
   - Tab "Settings" → scroll ke "Volumes"
   - Klik "Add Volume"
   - Mount Path: `/app/storage`
   - Klik "Add"

2. **Update Environment Variable**
   - Pastikan `STORAGE_PATH=/app/storage`

### Langkah 5: Verifikasi Deployment

1. **Cek Logs**
```bash
# Via CLI
railway logs

# Via Dashboard
Service → "Deployments" → klik deployment terbaru → "View Logs"
```

2. **Cek aplikasi berjalan**
   - Railway akan generate URL otomatis
   - Format: `https://your-app.railway.app`
   - Klik URL atau copy dari tab "Settings"

3. **Test koneksi database**
   - Akses: `https://your-app.railway.app/health`
   - Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-07T...",
  "storage_path": "/app/storage"
}
```

---

## ☁️ Deploy ke Render

### Langkah 1: Persiapan

1. **Buat akun Render**
   - Kunjungi [render.com](https://render.com)
   - Sign up dengan GitHub/GitLab
   - Verifikasi email

### Langkah 2: Setup Database PostgreSQL

1. **Buat PostgreSQL Database**
   - Dashboard → "New +" → "PostgreSQL"
   - Pilih:
     - Name: `userdb` (atau nama lain)
     - Region: Singapore (terdekat dengan Indonesia)
     - Plan: Free
   - Klik "Create Database"

2. **Catat Connection String**
   - Setelah database ready, copy "Internal Database URL"
   - Format: `postgresql://user:pass@host/db`

### Langkah 3: Deploy Aplikasi

1. **Push ke GitHub** (jika belum)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

2. **Buat Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repository
   - Konfigurasi:
     - **Name**: `user-management-app`
     - **Region**: Singapore
     - **Branch**: main
     - **Root Directory**: (kosongkan)
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Tambah Environment Variables**
   - Scroll ke "Environment Variables"
   - Klik "Add Environment Variable"
   - Tambahkan:

```env
NODE_ENV=production
DATABASE_URL=<paste Internal Database URL dari step 2>
STORAGE_PATH=/opt/render/project/storage
```

4. **Klik "Create Web Service"**

### Langkah 4: Setup Persistent Storage (Render Disk)

⚠️ **Catatan**: Free plan Render tidak support persistent disk. Ada 2 opsi:

**Opsi A: Upgrade ke Paid Plan ($7/month)**
1. Service Settings → "Disk"
2. Klik "Add Disk"
3. Name: `storage`
4. Mount Path: `/opt/render/project/storage`
5. Size: 1 GB
6. Save changes

**Opsi B: Gunakan Cloud Storage (Gratis)**
- Integrasi dengan Cloudinary/AWS S3/Google Cloud Storage
- Untuk demo/testing, file akan hilang saat redeploy

### Langkah 5: Verifikasi Deployment

1. **Tunggu build selesai** (~2-5 menit)

2. **Akses aplikasi**
   - URL format: `https://user-management-app.onrender.com`
   - Copy dari dashboard

3. **Test health endpoint**
```bash
curl https://your-app.onrender.com/health
```

---

## 🧪 Testing Aplikasi

### 1. Test Health Check
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-07T10:30:45.123Z",
  "storage_path": "/app/storage"
}
```

### 2. Test Create User via cURL

```bash
curl -X POST https://your-app.railway.app/api/users \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "photo=@/path/to/photo.jpg"
```

### 3. Test Get All Users

```bash
curl https://your-app.railway.app/api/users
```

### 4. Test via Browser

1. Buka `https://your-app.railway.app`
2. Isi form dengan data pengguna
3. Upload foto profil
4. Klik "Simpan Pengguna"
5. Lihat data muncul di daftar pengguna

---

## 📁 Struktur Project

```
cloud-user-app/
├── app.js                 # Main application file
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables (local)
├── .env.example           # Environment template
├── .gitignore             # Git ignore file
├── README.md              # Documentation
├── public/
│   └── index.html        # Frontend interface
└── storage/              # File uploads directory
    └── (uploaded files)
```

### File .gitignore

Buat file `.gitignore`:
```
node_modules/
.env
storage/*
!storage/.gitkeep
*.log
.DS_Store
```

Buat file `storage/.gitkeep` (kosong, untuk tracking folder):
```bash
touch storage/.gitkeep
```

---

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-07T10:30:45.123Z",
  "storage_path": "/app/storage"
}
```

### Get All Users
```
GET /api/users
```
Response:
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "photo_path": "/storage/1234567890-photo.jpg",
      "created_at": "2025-10-07T10:30:45.123Z"
    }
  ]
}
```

### Get User by ID
```
GET /api/users/:id
```

### Create User
```
POST /api/users
Content-Type: multipart/form-data

Fields:
- name: string (required)
- email: string (required)
- photo: file (optional, max 5MB, images only)
```

### Update User
```
PUT /api/users/:id
Content-Type: multipart/form-data

Fields:
- name: string (optional)
- email: string (optional)
- photo: file (optional)
```

### Delete User
```
DELETE /api/users/:id
```

---

## 🐛 Troubleshooting

### Error: Database connection failed

**Solusi:**
1. Cek DATABASE_URL sudah benar
2. Pastikan database PostgreSQL sudah running
3. Cek firewall/network settings

```bash
# Test koneksi manual
psql "postgresql://user:pass@host:5432/db"
```

### Error: ENOENT - storage directory not found

**Solusi Railway:**
```bash
# Pastikan volume sudah di-mount di /app/storage
railway volumes
```

**Solusi Render:**
- Pastikan Disk sudah ditambahkan di Settings

### Error: File upload not persisting after restart

**Railway:**
- Pastikan Volume sudah ditambahkan dan mount path correct

**Render:**
- Free plan tidak support persistent disk
- Upgrade ke paid plan atau gunakan cloud storage

### Error: Port already in use (lokal)

**Solusi:**
```bash
# Cari process yang pakai port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Atau ganti PORT di .env
PORT=3001
```

---

## 🚀 Optimizations & Best Practices

### 1. Database Connection Pooling
Aplikasi sudah menggunakan connection pool dengan `pg`. Konfigurasi default:
- Max connections: 10
- Idle timeout: 30s

### 2. File Upload Security
- ✅ File type validation (hanya images)
- ✅ File size limit (5MB)
- ✅ Unique filename generation
- ✅ Safe file storage path

### 3. Error Handling
- ✅ Comprehensive try-catch blocks
- ✅ Proper HTTP status codes
- ✅ User-friendly error messages
- ✅ Graceful shutdown handling

### 4. Production Considerations
- ✅ Environment-based configuration
- ✅ SSL enforcement for production database
- ✅ Health check endpoint for monitoring
- ✅ Proper logging

---

## 📊 Monitoring

### Railway Monitoring

```bash
# Via CLI
railway logs --tail

# Via Dashboard
Service → Deployments → View Logs
Service → Metrics (usage graphs)
```

### Render Monitoring

- Dashboard → Service → Logs
- Dashboard → Service → Metrics
- Setup alerts untuk downtime

---

## 🔐 Security Notes

1. **Environment Variables**: Jangan commit `.env` ke Git
2. **Database Credentials**: Gunakan strong passwords
3. **File Upload**: Validasi type dan size
4. **SQL Injection**: Menggunakan parameterized queries (pg)
5. **HTTPS**: Railway & Render sudah menyediakan SSL otomatis

---

## 📝 Next Steps

Untuk pengembangan lebih lanjut:

1. ✨ Tambah authentication (JWT/OAuth)
2. ✨ Implement pagination untuk list users
3. ✨ Add search & filter functionality
4. ✨ Integrate cloud storage (Cloudinary/S3)
5. ✨ Add email notification
6. ✨ Implement rate limiting
7. ✨ Add unit & integration tests
8. ✨ Setup CI/CD pipeline

---

## 📞 Support

Jika mengalami masalah:

1. Check logs: `railway logs` atau via Render dashboard
2. Verify environment variables
3. Test database connection via `/health` endpoint
4. Check Railway/Render status page

---

## 📄 License

MIT License - Feel free to use for learning purposes!

---

**Selamat! 🎉** Aplikasi Anda sudah siap digunakan. Akses di browser dan mulai menambahkan pengguna!
