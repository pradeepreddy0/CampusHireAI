# ============================================================
# models.py — Pydantic Schemas for Request / Response Validation
# These models define the shape of data sent to and from the API.
# ============================================================

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date


# ── Auth Models ──────────────────────────────────────────────

class UserSignup(BaseModel):
    """Data required to register a new student (admin signup disabled)."""
    roll_no: str
    name: str
    email: str
    password: str
    role: str = "student"          # Always forced to "student" in endpoint
    branch: Optional[str] = None
    cgpa: Optional[float] = 0.0
    cgpa_10th: Optional[float] = 0.0
    percentage_12th: Optional[float] = 0.0


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
    package: Optional[float] = 0.0       # CTC/LPA offered (for 1.7× filter)


class DriveResponse(BaseModel):
    """Drive data returned to the client."""
    id: int
    company_name: str
    role: str
    eligibility_cgpa: float
    required_skills: list
    deadline: Optional[str] = None
    package: Optional[float] = 0.0
    jd_url: Optional[str] = None
    created_at: Optional[str] = None


# ── Application Models ───────────────────────────────────────

class ApplicationCreate(BaseModel):
    """Data required to apply to a drive."""
    drive_id: int
    resume_id: Optional[int] = None      # which resume to use for this application


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
    top_n: Optional[int] = None         # only shortlist top N students
    apply_offer_filter: bool = False    # apply 1.7× previous offer filter


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


class MarkPlaced(BaseModel):
    """Data for marking a student as placed (admin action)."""
    package: float = 0.0
    offer_date: Optional[str] = None


# ── Training Resource Models ────────────────────────────────

class TrainingResourceCreate(BaseModel):
    """Data for admin to add a training resource."""
    skill: str
    title: str
    link: Optional[str] = None
    type: Optional[str] = "video"       # video, article, course, blog


# ── Interview Experience Models ─────────────────────────────

class InterviewExperienceCreate(BaseModel):
    """Data for admin to add interview experience / prep tips."""
    drive_id: Optional[int] = None      # linked to a drive (optional)
    title: str
    content: str                         # questions / experience write-up
    tips: Optional[str] = None           # admin preparation tips


# ── Student Review Models ───────────────────────────────────

class StudentReviewCreate(BaseModel):
    """Data for a placed student to review a company."""
    drive_id: Optional[int] = None
    company: str
    rating: int                          # 1 to 5
    content: str                         # review text


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
    year_wise_stats: dict                # { "2024": { drives, offers, placed }, ... }

