-- ============================================================
-- CampusHireAI — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. USERS — students and admins
-- ──────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_no     TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,               -- bcrypt hash
    role        TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'admin')),
    branch      TEXT,
    cgpa        NUMERIC(4, 2) DEFAULT 0.00
                CHECK (cgpa >= 0 AND cgpa <= 10),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 2. DRIVES — placement drives created by admin
-- ──────────────────────────────────────────────
CREATE TABLE drives (
    id               SERIAL PRIMARY KEY,
    company_name     TEXT NOT NULL,
    role             TEXT NOT NULL,
    eligibility_cgpa NUMERIC(4, 2) DEFAULT 0.00,
    required_skills  JSONB DEFAULT '[]'::jsonb,   -- e.g. ["Python", "SQL", "React"]
    deadline         TIMESTAMPTZ,
    package          NUMERIC(10, 2) DEFAULT 0.00, -- offered CTC/LPA (for 1.7× filter)
    jd_url           TEXT,                         -- Supabase Storage URL for JD PDF/DOCX
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. APPLICATIONS — student ↔ drive link
-- ──────────────────────────────────────────────
CREATE TABLE applications (
    id          SERIAL PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drive_id    INTEGER NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    resume_id   INTEGER,                          -- links to the resume used for this application
    status      TEXT NOT NULL DEFAULT 'Applied'
                CHECK (status IN ('Applied', 'Shortlisted', 'Rejected', 'Offered', 'Placed')),
    ai_score    NUMERIC(5, 2) DEFAULT 0.00,
    applied_at  TIMESTAMPTZ DEFAULT NOW(),

    -- prevent duplicate applications
    UNIQUE (student_id, drive_id)
);

-- ──────────────────────────────────────────────
-- 4. RESUME_METADATA — extracted resume info (multiple per student)
-- ──────────────────────────────────────────────
CREATE TABLE resume_metadata (
    id                 SERIAL PRIMARY KEY,
    student_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label              TEXT DEFAULT 'Resume',        -- e.g. "General", "SDE Resume", "Data Science"
    resume_url         TEXT,
    extracted_skills   JSONB DEFAULT '[]'::jsonb,   -- ["Python", "React", ...]
    extracted_projects JSONB DEFAULT '[]'::jsonb,   -- [{"name": "...", "desc": "..."}]
    uploaded_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 5. TRAINING_RESOURCES — skill → learning link
-- ──────────────────────────────────────────────
CREATE TABLE training_resources (
    id     SERIAL PRIMARY KEY,
    skill  TEXT NOT NULL,
    title  TEXT NOT NULL,
    link   TEXT,
    type   TEXT           -- e.g. "video", "article", "course", "blog"
);

-- ──────────────────────────────────────────────
-- 6. OFFERS — final placement offers
-- ──────────────────────────────────────────────
CREATE TABLE offers (
    id          SERIAL PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company     TEXT NOT NULL,
    package     NUMERIC(10, 2),               -- LPA or CTC
    offer_date  DATE DEFAULT CURRENT_DATE
);

-- ──────────────────────────────────────────────
-- 7. INTERVIEW_EXPERIENCES — previous year Q&A + tips
-- ──────────────────────────────────────────────
CREATE TABLE interview_experiences (
    id          SERIAL PRIMARY KEY,
    drive_id    INTEGER REFERENCES drives(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,                 -- questions / experience write-up
    tips        TEXT,                          -- admin tips for preparation
    added_by    UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 8. STUDENT_REVIEWS — placed students review companies
-- ──────────────────────────────────────────────
CREATE TABLE student_reviews (
    id          SERIAL PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drive_id    INTEGER REFERENCES drives(id) ON DELETE CASCADE,
    company     TEXT NOT NULL,
    rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Indexes for common queries
-- ──────────────────────────────────────────────
CREATE INDEX idx_applications_drive   ON applications(drive_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_offers_student       ON offers(student_id);
CREATE INDEX idx_experiences_drive    ON interview_experiences(drive_id);
CREATE INDEX idx_reviews_drive        ON student_reviews(drive_id);
CREATE INDEX idx_reviews_student      ON student_reviews(student_id);
