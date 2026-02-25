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
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 3. APPLICATIONS — student ↔ drive link
-- ──────────────────────────────────────────────
CREATE TABLE applications (
    id          SERIAL PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drive_id    INTEGER NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'Applied'
                CHECK (status IN ('Applied', 'Shortlisted', 'Rejected', 'Offered')),
    ai_score    NUMERIC(5, 2) DEFAULT 0.00,
    applied_at  TIMESTAMPTZ DEFAULT NOW(),

    -- prevent duplicate applications
    UNIQUE (student_id, drive_id)
);

-- ──────────────────────────────────────────────
-- 4. RESUME_METADATA — extracted resume info
-- ──────────────────────────────────────────────
CREATE TABLE resume_metadata (
    student_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
    type   TEXT           -- e.g. "video", "article", "course"
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
-- Indexes for common queries
-- ──────────────────────────────────────────────
CREATE INDEX idx_applications_drive   ON applications(drive_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_offers_student       ON offers(student_id);
