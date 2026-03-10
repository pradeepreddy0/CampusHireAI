-- ============================================================
-- CampusHireAI — Database Schema Additions for AI Features
-- Run this in your Supabase SQL editor (Settings → SQL Editor)
-- ============================================================

-- Add resume analysis columns to resume_metadata
ALTER TABLE resume_metadata ADD COLUMN IF NOT EXISTS resume_score FLOAT DEFAULT NULL;
ALTER TABLE resume_metadata ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT NULL;

-- Add job match columns to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score FLOAT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_explanation JSONB DEFAULT NULL;

-- Add placement prediction cache to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_prediction FLOAT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_updated_at TIMESTAMP DEFAULT NULL;

-- ============================================================
-- Optional: Add index for faster resume lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resume_metadata_student_id ON resume_metadata(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_drive ON applications(student_id, drive_id);
