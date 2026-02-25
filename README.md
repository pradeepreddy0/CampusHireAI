# CampusHireAI — University Hiring & Training Platform

A full-stack platform for university placements with AI-based shortlisting, built with **React + FastAPI + Supabase**.

---

## 🛠️ Tech Stack

| Layer    | Technology                                      |
|----------|------------------------------------------------|
| Frontend | React (Vite), Tailwind CSS, Chart.js, Axios    |
| Backend  | FastAPI, bcrypt, python-jose (JWT), pdfplumber, spaCy, pandas |
| Database | Supabase (PostgreSQL + Storage)                 |

---

## ⚡ Quick Start

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** and create a bucket named `resumes` (set it to public)
4. Copy your project **URL** and **anon key** from Settings → API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Configure environment
# Edit .env and fill in your Supabase URL, Key, JWT secret, and SMTP creds

# Run the server
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`
Docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App will be available at `http://localhost:5173`

---

## 📁 .env Structure

### `backend/.env`

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=1440
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### `frontend/.env`

```
VITE_API_URL=http://localhost:8000/api
```

---

## 📡 Example API Requests

### Signup
```bash
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "roll_no": "21CS001",
    "name": "John Doe",
    "email": "john@uni.edu",
    "password": "pass123",
    "role": "student",
    "branch": "CSE",
    "cgpa": 8.5
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@uni.edu", "password": "pass123"}'
```

### Create Drive (Admin)
```bash
curl -X POST http://localhost:8000/api/drives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "role": "SDE Intern",
    "eligibility_cgpa": 7.0,
    "required_skills": ["Python", "SQL", "React"]
  }'
```

### Upload Resume
```bash
curl -X POST http://localhost:8000/api/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.pdf"
```

### Run Shortlisting (Admin)
```bash
curl -X POST http://localhost:8000/api/shortlist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drive_id": 1, "threshold": 0.5}'
```

### Export Shortlisted (Admin)
```bash
curl -O http://localhost:8000/api/export-shortlisted/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Features

- ✅ Student registration with roll number
- ✅ Admin panel with analytics dashboard
- ✅ Drive creation and management
- ✅ Resume upload with PDF parsing (pdfplumber)
- ✅ AI skill extraction (spaCy + keyword matching)
- ✅ CGPA + skill-based shortlisting algorithm
- ✅ Skill gap analysis with training recommendations
- ✅ Email notifications via SMTP
- ✅ Excel export of shortlisted students
- ✅ Chart.js analytics (placement %, branch stats, skill heatmap)
- ✅ JWT authentication with role-based routing
