# ============================================================
# models.py — Pydantic Schemas for Request / Response Validation
# These models define the shape of data sent to and from the API.
# ============================================================

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# ── Auth Models ──────────────────────────────────────────────

class UserSignup(BaseModel):
    """Data required to register a new user."""
    roll_no: str
    name: str
    email: str
    password: str
    role: str = "student"          # "student" or "admin"
    branch: Optional[str] = None
    cgpa: Optional[float] = 0.0


class UserLogin(BaseModel):
    """Data required to log in."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str


# ── Drive Models ─────────────────────────────────────────────

class DriveCreate(BaseModel):
    """Data required to create a new placement drive."""
    company_name: str
    role: str
    eligibility_cgpa: float = 0.0
    required_skills: List[str] = []      # e.g. ["Python", "SQL"]
    deadline: Optional[str] = None       # ISO date string


class DriveResponse(BaseModel):
    """Drive data returned to the client."""
    id: int
    company_name: str
    role: str
    eligibility_cgpa: float
    required_skills: list
    deadline: Optional[str] = None
    created_at: Optional[str] = None


# ── Application Models ───────────────────────────────────────

class ApplicationCreate(BaseModel):
    """Data required to apply to a drive."""
    drive_id: int


class ApplicationResponse(BaseModel):
    """Application data returned to the client."""
    id: int
    student_id: str
    drive_id: int
    status: str
    ai_score: float
    applied_at: Optional[str] = None


# ── Shortlisting Models ─────────────────────────────────────

class ShortlistRequest(BaseModel):
    """Parameters for running the shortlisting algorithm."""
    drive_id: int
    threshold: float = 0.5              # minimum final score to shortlist


# ── Skill Gap Models ────────────────────────────────────────

class SkillGapResponse(BaseModel):
    """Result of skill-gap analysis for a student vs a drive."""
    matched_skills: List[str]
    missing_skills: List[str]


# ── Offer Models ────────────────────────────────────────────

class OfferCreate(BaseModel):
    """Data required to record a placement offer."""
    student_id: str
    company: str
    package: float
    offer_date: Optional[str] = None


# ── Analytics Models ────────────────────────────────────────

class AnalyticsResponse(BaseModel):
    """Summary statistics for the admin dashboard."""
    total_students: int
    total_drives: int
    total_shortlisted: int
    total_offers: int
    placement_rate: float                # percentage
    branch_stats: dict                   # { "CSE": 12, "ECE": 5, ... }
    skill_distribution: dict             # { "Python": 20, "SQL": 15, ... }
