-- ============================================================
-- CampusHireAI — Drive Workflow Schema Extension
-- Run this in the Supabase SQL Editor AFTER the main schema.
-- ============================================================

-- 9. DRIVE_STAGES — ordered stages per drive (manual, with defaults)
-- Default stages inserted automatically when drive is shortlisted:
--   1. Shortlisted  2. Exam  3. Interview  4. Offered
-- Admin can add more at any time.
CREATE TABLE drive_stages (
    id          SERIAL PRIMARY KEY,
    drive_id    INTEGER NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,          -- "Shortlisted", "Exam", "Interview-1", "HR Round", etc.
    stage_order INTEGER NOT NULL,       -- 1, 2, 3, 4 (determines visual order in pipeline)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STAGE_PROGRESS — tracks each shortlisted student per stage
CREATE TABLE stage_progress (
    id             SERIAL PRIMARY KEY,
    stage_id       INTEGER NOT NULL REFERENCES drive_stages(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status         TEXT NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'Cleared', 'Eliminated')),
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (stage_id, application_id)   -- one record per student per stage
);

-- Indexes for fast lookups
CREATE INDEX idx_drive_stages_drive      ON drive_stages(drive_id);
CREATE INDEX idx_drive_stages_order      ON drive_stages(drive_id, stage_order);
CREATE INDEX idx_stage_progress_stage    ON stage_progress(stage_id);
CREATE INDEX idx_stage_progress_app      ON stage_progress(application_id);
