# ============================================================
# main.py — FastAPI Application Entry Point
#
# This is the central file that creates the FastAPI app,
# defines all API routes, and ties together all modules.
#
# Run with:  uvicorn main:app --reload --port 8000
# ============================================================

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io

# ── Local module imports ─────────────────────────────────────
from database import supabase
from auth import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
    require_admin,
)
from models import (
    UserSignup,
    UserLogin,
    TokenResponse,
    DriveCreate,
    DriveResponse,
    ApplicationCreate,
    ShortlistRequest,
    OfferCreate,
    AnalyticsResponse,
)
from resume_parser import upload_and_parse_resume
from shortlisting import run_shortlisting
from skill_analyzer import analyze_skill_gap, get_all_training_resources
from email_service import send_shortlist_email
from excel_export import generate_shortlisted_excel

# ── Create FastAPI App ───────────────────────────────────────
app = FastAPI(
    title="CampusHireAI",
    description="University Hiring & Training Platform API",
    version="1.0.0",
)

# ── CORS Middleware ──────────────────────────────────────────
# Allow the React frontend (running on port 5173) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/signup", tags=["Auth"])
async def signup(user: UserSignup):
    """
    Register a new student or admin account.
    - Hashes the password with bcrypt
    - Inserts into users table
    - Returns a JWT token
    """
    # Hash the password before storing
    hashed_pw = hash_password(user.password)

    # Insert into Supabase
    try:
        resp = supabase.table("users").insert({
            "roll_no": user.roll_no,
            "name": user.name,
            "email": user.email,
            "password": hashed_pw,
            "role": user.role,
            "branch": user.branch,
            "cgpa": user.cgpa,
        }).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )

    new_user = resp.data[0]

    # Create JWT token
    token = create_token({
        "sub": new_user["id"],
        "email": new_user["email"],
        "role": new_user["role"],
        "name": new_user["name"],
    })

    return TokenResponse(
        access_token=token,
        role=new_user["role"],
        user_id=new_user["id"],
        name=new_user["name"],
    )


@app.post("/api/login", response_model=TokenResponse, tags=["Auth"])
async def login(credentials: UserLogin):
    """
    Authenticate a user with email and password.
    - Fetches user by email
    - Verifies bcrypt hash
    - Returns a JWT token
    """
    # Look up user by email
    resp = (
        supabase.table("users")
        .select("*")
        .eq("email", credentials.email)
        .execute()
    )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = resp.data[0]

    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    token = create_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
    })

    return TokenResponse(
        access_token=token,
        role=user["role"],
        user_id=user["id"],
        name=user["name"],
    )


@app.get("/api/me", tags=["Auth"])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's profile.
    Requires a valid JWT token in the Authorization header.
    """
    user_id = current_user["sub"]

    resp = (
        supabase.table("users")
        .select("id, roll_no, name, email, role, branch, cgpa, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found")

    return resp.data


# ═════════════════════════════════════════════════════════════
#  DRIVE ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/drives", tags=["Drives"])
async def create_drive(drive: DriveCreate, admin: dict = Depends(require_admin)):
    """
    Create a new placement drive.
    Admin-only endpoint.
    """
    resp = supabase.table("drives").insert({
        "company_name": drive.company_name,
        "role": drive.role,
        "eligibility_cgpa": drive.eligibility_cgpa,
        "required_skills": drive.required_skills,
        "deadline": drive.deadline,
    }).execute()

    return {"message": "Drive created successfully", "drive": resp.data[0]}


@app.get("/api/drives", tags=["Drives"])
async def list_drives(current_user: dict = Depends(get_current_user)):
    """
    List all placement drives.
    Available to both students and admins.
    """
    resp = (
        supabase.table("drives")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.get("/api/drives/{drive_id}", tags=["Drives"])
async def get_drive(drive_id: int, current_user: dict = Depends(get_current_user)):
    """Get details of a specific drive."""
    resp = (
        supabase.table("drives")
        .select("*")
        .eq("id", drive_id)
        .single()
        .execute()
    )

    if not resp.data:
        raise HTTPException(status_code=404, detail="Drive not found")

    return resp.data


# ═════════════════════════════════════════════════════════════
#  APPLICATION ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/applications", tags=["Applications"])
async def apply_to_drive(
    application: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Apply to a placement drive as a student.
    Checks if already applied to prevent duplicates.
    """
    student_id = current_user["sub"]

    # Check for duplicate application
    existing = (
        supabase.table("applications")
        .select("id")
        .eq("student_id", student_id)
        .eq("drive_id", application.drive_id)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this drive",
        )

    # Create application
    resp = supabase.table("applications").insert({
        "student_id": student_id,
        "drive_id": application.drive_id,
        "status": "Applied",
        "ai_score": 0.0,
    }).execute()

    return {"message": "Application submitted successfully", "application": resp.data[0]}


@app.get("/api/applications/my", tags=["Applications"])
async def my_applications(current_user: dict = Depends(get_current_user)):
    """
    Get all applications for the current student.
    Includes drive details for display.
    """
    student_id = current_user["sub"]

    resp = (
        supabase.table("applications")
        .select("*, drives(*)")
        .eq("student_id", student_id)
        .order("applied_at", desc=True)
        .execute()
    )

    return resp.data


@app.get("/api/applications/drive/{drive_id}", tags=["Applications"])
async def get_drive_applications(
    drive_id: int,
    admin: dict = Depends(require_admin),
):
    """
    Get all applications for a specific drive.
    Admin-only — used on the Shortlist Results page.
    """
    resp = (
        supabase.table("applications")
        .select("*, users(roll_no, name, email, branch, cgpa)")
        .eq("drive_id", drive_id)
        .order("ai_score", desc=True)
        .execute()
    )

    return resp.data


# ═════════════════════════════════════════════════════════════
#  RESUME ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/resume/upload", tags=["Resume"])
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a resume PDF.
    - Stores the file in Supabase Storage
    - Extracts text using pdfplumber
    - Extracts skills using spaCy + keyword matching
    - Saves extracted data to resume_metadata table
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    student_id = current_user["sub"]
    file_bytes = await file.read()

    # Run the full parsing pipeline
    result = await upload_and_parse_resume(file_bytes, file.filename, student_id)

    return {
        "message": "Resume uploaded and parsed successfully",
        "data": result,
    }


@app.get("/api/resume/my", tags=["Resume"])
async def get_my_resume(current_user: dict = Depends(get_current_user)):
    """Get the current student's resume metadata."""
    student_id = current_user["sub"]

    resp = (
        supabase.table("resume_metadata")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    if not resp.data:
        return {"message": "No resume uploaded yet"}

    return resp.data[0]


# ═════════════════════════════════════════════════════════════
#  SHORTLISTING ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/shortlist", tags=["Shortlisting"])
async def shortlist_students(
    request: ShortlistRequest,
    admin: dict = Depends(require_admin),
):
    """
    Run the AI shortlisting algorithm for a drive.
    Admin-only endpoint.

    Algorithm:
      - Filters by CGPA eligibility
      - Calculates: 0.6 * skill_score + 0.4 * (cgpa/10)
      - Shortlists students above the threshold
    """
    result = run_shortlisting(request.drive_id, request.threshold)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    # Send email notifications to shortlisted students
    for r in result.get("results", []):
        if r.get("status") == "Shortlisted" and r.get("email"):
            send_shortlist_email(
                to_email=r["email"],
                student_name=r.get("name", "Student"),
                company_name=result.get("company", ""),
            )

    return result


@app.get("/api/shortlist/{drive_id}", tags=["Shortlisting"])
async def get_shortlist_results(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get shortlisting results for a drive.
    Returns all applications with their status and AI score.
    """
    resp = (
        supabase.table("applications")
        .select("*, users(roll_no, name, email, branch, cgpa)")
        .eq("drive_id", drive_id)
        .order("ai_score", desc=True)
        .execute()
    )

    return resp.data


# ═════════════════════════════════════════════════════════════
#  SKILL GAP & TRAINING ROUTES
# ═════════════════════════════════════════════════════════════

@app.get("/api/skill-gap/{drive_id}", tags=["Skill Analysis"])
async def skill_gap(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Get skill-gap analysis for the current student vs a drive.
    Shows matched skills, missing skills, and training resources.
    """
    student_id = current_user["sub"]
    result = analyze_skill_gap(student_id, drive_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@app.get("/api/training", tags=["Skill Analysis"])
async def list_training_resources(current_user: dict = Depends(get_current_user)):
    """Get all available training resources."""
    return get_all_training_resources()


# ═════════════════════════════════════════════════════════════
#  EXCEL EXPORT ROUTE
# ═════════════════════════════════════════════════════════════

@app.get("/api/export-shortlisted/{drive_id}", tags=["Export"])
async def export_shortlisted(
    drive_id: int,
    admin: dict = Depends(require_admin),
):
    """
    Export shortlisted students for a drive as an Excel file.
    Admin-only endpoint.
    Returns a downloadable .xlsx file.
    """
    excel_bytes = generate_shortlisted_excel(drive_id)

    if not excel_bytes:
        raise HTTPException(
            status_code=404,
            detail="No shortlisted students found for this drive",
        )

    # Return as downloadable file
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=shortlisted_drive_{drive_id}.xlsx"
        },
    )


# ═════════════════════════════════════════════════════════════
#  OFFERS ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/offers", tags=["Offers"])
async def create_offer(
    offer: OfferCreate,
    admin: dict = Depends(require_admin),
):
    """Record a placement offer for a student. Admin-only."""
    resp = supabase.table("offers").insert({
        "student_id": offer.student_id,
        "company": offer.company,
        "package": offer.package,
        "offer_date": offer.offer_date,
    }).execute()

    # Update application status to "Offered" if applicable
    supabase.table("applications").update({
        "status": "Offered",
    }).eq("student_id", offer.student_id).execute()

    return {"message": "Offer recorded", "offer": resp.data[0]}


@app.get("/api/offers/my", tags=["Offers"])
async def my_offers(current_user: dict = Depends(get_current_user)):
    """Get the current student's placement offers."""
    student_id = current_user["sub"]

    resp = (
        supabase.table("offers")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )

    return resp.data


# ═════════════════════════════════════════════════════════════
#  ANALYTICS ROUTES
# ═════════════════════════════════════════════════════════════

@app.get("/api/analytics", tags=["Analytics"])
async def get_analytics(admin: dict = Depends(require_admin)):
    """
    Get analytics data for the admin dashboard.
    Returns totals, placement rate, branch stats, and skill distribution.
    """
    # Total students
    students_resp = (
        supabase.table("users")
        .select("id, branch", count="exact")
        .eq("role", "student")
        .execute()
    )
    total_students = students_resp.count or 0

    # Total drives
    drives_resp = (
        supabase.table("drives")
        .select("id", count="exact")
        .execute()
    )
    total_drives = drives_resp.count or 0

    # Shortlisted count
    shortlisted_resp = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("status", "Shortlisted")
        .execute()
    )
    total_shortlisted = shortlisted_resp.count or 0

    # Offers count
    offers_resp = (
        supabase.table("offers")
        .select("id, student_id", count="exact")
        .execute()
    )
    total_offers = offers_resp.count or 0

    # Placement rate = (students with offers / total students) * 100
    placement_rate = 0.0
    if total_students > 0:
        # Get unique students with offers
        unique_placed = len(set(o["student_id"] for o in (offers_resp.data or [])))
        placement_rate = round((unique_placed / total_students) * 100, 2)

    # Branch-wise student distribution
    branch_stats = {}
    for s in (students_resp.data or []):
        branch = s.get("branch", "Unknown") or "Unknown"
        branch_stats[branch] = branch_stats.get(branch, 0) + 1

    # Skill distribution — aggregate from all resume_metadata
    skill_dist = {}
    resumes_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills")
        .execute()
    )
    for r in (resumes_resp.data or []):
        for skill in (r.get("extracted_skills") or []):
            skill_dist[skill] = skill_dist.get(skill, 0) + 1

    return AnalyticsResponse(
        total_students=total_students,
        total_drives=total_drives,
        total_shortlisted=total_shortlisted,
        total_offers=total_offers,
        placement_rate=placement_rate,
        branch_stats=branch_stats,
        skill_distribution=skill_dist,
    )


# ═════════════════════════════════════════════════════════════
#  ROOT / HEALTH CHECK
# ═════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "app": "CampusHireAI",
        "version": "1.0.0",
    }
