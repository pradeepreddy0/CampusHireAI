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
import os
import uuid as uuid_lib

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
    MarkPlaced,
    AnalyticsResponse,
    TrainingResourceCreate,
    StudentReviewCreate,
    InterviewExperienceCreate,
)
from resume_parser import upload_and_parse_resume
from shortlisting import run_shortlisting
from skill_analyzer import analyze_skill_gap, analyze_skill_gap_for_role, get_all_training_resources
from email_service import send_shortlist_email, send_selection_email, send_stage_email
from excel_export import generate_shortlisted_excel

# ── AI Feature Modules ───────────────────────────────────────
from ai_resume_analyzer import analyze_resume_by_id, compute_resume_score
from job_matcher import get_match_for_student_drive, get_match_all_drives
from placement_predictor import predict_placement, batch_predict
from smart_recommender import (
    recommend_drives,
    recommend_training,
    recommend_experiences,
    get_all_recommendations,
)
from analytics_engine import (
    get_placement_trends,
    get_branch_placement_rates,
    get_skill_demand,
    get_recruiter_activity,
    get_application_funnel,
    get_package_distribution,
    get_ai_overview,
)

# ── Create FastAPI App ───────────────────────────────────────
app = FastAPI(
    title="CampusHireAI",
    description="University Hiring & Training Platform API",
    version="2.0.0",
)

# ── CORS Middleware ──────────────────────────────────────────
# Allow the React frontend (running on port 5173) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    Register a new STUDENT account only.
    Admin accounts cannot be created via signup — they must be
    added directly in the database.
    """
    # Force role to student — admin signup is disabled
    forced_role = "student"

    hashed_pw = hash_password(user.password)

    try:
        resp = supabase.table("users").insert({
            "roll_no": user.roll_no,
            "name": user.name,
            "email": user.email,
            "password": hashed_pw,
            "role": forced_role,
            "branch": user.branch,
            "cgpa": user.cgpa,
            "cgpa_10th": user.cgpa_10th,
            "percentage_12th": user.percentage_12th,
        }).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )

    new_user = resp.data[0]

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
    """
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

    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

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
    """Get the current user's profile."""
    user_id = current_user["sub"]

    resp = (
        supabase.table("users")
        .select("id, roll_no, name, email, role, branch, cgpa, cgpa_10th, percentage_12th, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found")

    return resp.data


@app.put("/api/me", tags=["Auth"])
async def update_profile(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's profile (name, branch, CGPA, roll_no, phone)."""
    user_id = current_user["sub"]

    allowed = {}
    for field in ("name", "branch", "cgpa", "roll_no", "phone", "cgpa_10th", "percentage_12th"):
        if field in body and body[field] is not None:
            allowed[field] = body[field]

    if not allowed:
        raise HTTPException(status_code=400, detail="No fields to update")

    resp = (
        supabase.table("users")
        .update(allowed)
        .eq("id", user_id)
        .execute()
    )

    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Profile updated", "user": resp.data[0]}


# ═════════════════════════════════════════════════════════════
#  DRIVE ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/drives", tags=["Drives"])
async def create_drive(drive: DriveCreate, admin: dict = Depends(require_admin)):
    """Create a new placement drive. Admin-only."""
    resp = supabase.table("drives").insert({
        "company_name": drive.company_name,
        "role": drive.role,
        "eligibility_cgpa": drive.eligibility_cgpa,
        "required_skills": drive.required_skills,
        "deadline": drive.deadline,
        "package": drive.package or 0,
    }).execute()

    return {"message": "Drive created successfully", "drive": resp.data[0]}


@app.get("/api/drives", tags=["Drives"])
async def list_drives(current_user: dict = Depends(get_current_user)):
    """List all placement drives."""
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


# ── JD Upload ────────────────────────────────────────────────

@app.post("/api/drives/{drive_id}/jd", tags=["Drives"])
async def upload_jd(
    drive_id: int,
    file: UploadFile = File(...),
    admin: dict = Depends(require_admin),
):
    """
    Upload a Job Description (PDF or DOCX) for a drive.
    Stores the file in Supabase Storage and updates the drive's jd_url.
    Admin-only.
    """
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF or DOCX files are allowed",
        )

    file_bytes = await file.read()
    ext = filename_lower.rsplit(".", 1)[-1]
    storage_name = f"jd_{drive_id}_{uuid_lib.uuid4().hex[:8]}.{ext}"

    # Upload to 'jds' bucket
    try:
        supabase.storage.from_("jds").upload(storage_name, file_bytes)
    except Exception:
        # If file exists, remove and re-upload
        try:
            supabase.storage.from_("jds").remove([storage_name])
            supabase.storage.from_("jds").upload(storage_name, file_bytes)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"JD upload failed: {str(e)}")

    jd_url = supabase.storage.from_("jds").get_public_url(storage_name)

    # Update drive record
    supabase.table("drives").update({"jd_url": jd_url}).eq("id", drive_id).execute()

    return {"message": "JD uploaded successfully", "jd_url": jd_url}


# ═════════════════════════════════════════════════════════════
#  APPLICATION ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/applications", tags=["Applications"])
async def apply_to_drive(
    application: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
):
    """Apply to a placement drive as a student."""
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

    # Create application with optional resume_id
    insert_data = {
        "student_id": student_id,
        "drive_id": application.drive_id,
        "status": "Applied",
        "ai_score": 0.0,
    }
    if hasattr(application, 'resume_id') and application.resume_id:
        insert_data["resume_id"] = application.resume_id

    resp = supabase.table("applications").insert(insert_data).execute()

    return {"message": "Application submitted successfully", "application": resp.data[0]}


@app.get("/api/applications/my", tags=["Applications"])
async def my_applications(current_user: dict = Depends(get_current_user)):
    """Get all applications for the current student."""
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
    """Get all applications for a specific drive. Admin-only."""
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
    label: str = "Resume",
    current_user: dict = Depends(get_current_user),
):
    """Upload a resume PDF, extract skills and projects. Supports multiple resumes."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    student_id = current_user["sub"]
    file_bytes = await file.read()

    result = await upload_and_parse_resume(file_bytes, file.filename, student_id, label)

    return {
        "message": "Resume uploaded and parsed successfully",
        "data": result,
    }


@app.get("/api/resume/my", tags=["Resume"])
async def get_my_resumes(current_user: dict = Depends(get_current_user)):
    """Get all resumes for the current student."""
    student_id = current_user["sub"]

    resp = (
        supabase.table("resume_metadata")
        .select("*")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .execute()
    )

    return resp.data or []


@app.delete("/api/resume/{resume_id}", tags=["Resume"])
async def delete_resume(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete a specific resume."""
    student_id = current_user["sub"]
    supabase.table("resume_metadata").delete().eq("id", resume_id).eq("student_id", student_id).execute()
    return {"message": "Resume deleted"}


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
    Supports optional top_n and 1.7× offer filter.
    Admin-only.
    """
    result = run_shortlisting(
        drive_id=request.drive_id,
        threshold=request.threshold,
        top_n=request.top_n,
        apply_offer_filter=request.apply_offer_filter,
    )

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
    """Get shortlisting results for a drive."""
    resp = (
        supabase.table("applications")
        .select("*, users(roll_no, name, email, branch, cgpa)")
        .eq("drive_id", drive_id)
        .order("ai_score", desc=True)
        .execute()
    )

    return resp.data


@app.put("/api/applications/{application_id}/place", tags=["Shortlisting"])
async def mark_placed(
    application_id: int,
    body: MarkPlaced,
    admin: dict = Depends(require_admin),
):
    """Mark a shortlisted student as Placed. Admin-only."""
    app_resp = (
        supabase.table("applications")
        .select("*, users(id, name, email), drives(company_name)")
        .eq("id", application_id)
        .single()
        .execute()
    )

    if not app_resp.data:
        raise HTTPException(status_code=404, detail="Application not found")

    app_data = app_resp.data
    student = app_data.get("users", {})
    drive = app_data.get("drives", {})

    supabase.table("applications").update({
        "status": "Placed",
    }).eq("id", application_id).execute()

    supabase.table("offers").insert({
        "student_id": student.get("id"),
        "company": drive.get("company_name", ""),
        "package": body.package,
        "offer_date": body.offer_date,
    }).execute()

    if student.get("email"):
        send_selection_email(
            to_email=student["email"],
            student_name=student.get("name", "Student"),
            company_name=drive.get("company_name", ""),
            package=body.package,
        )

    return {
        "message": f"{student.get('name', 'Student')} marked as Placed",
        "application_id": application_id,
    }


@app.post("/api/shortlist/{drive_id}/notify", tags=["Shortlisting"])
async def send_shortlist_notifications(
    drive_id: int,
    admin: dict = Depends(require_admin),
):
    """Send shortlist notification emails to all shortlisted students. Admin-only."""
    drive_resp = (
        supabase.table("drives")
        .select("company_name")
        .eq("id", drive_id)
        .single()
        .execute()
    )

    if not drive_resp.data:
        raise HTTPException(status_code=404, detail="Drive not found")

    company = drive_resp.data["company_name"]

    apps_resp = (
        supabase.table("applications")
        .select("*, users(name, email)")
        .eq("drive_id", drive_id)
        .eq("status", "Shortlisted")
        .execute()
    )

    sent_count = 0
    for app in (apps_resp.data or []):
        student = app.get("users", {})
        if student.get("email"):
            success = send_shortlist_email(
                to_email=student["email"],
                student_name=student.get("name", "Student"),
                company_name=company,
            )
            if success:
                sent_count += 1

    return {
        "message": f"Sent {sent_count} shortlist notification emails",
        "emails_sent": sent_count,
        "total_shortlisted": len(apps_resp.data or []),
    }


# ═════════════════════════════════════════════════════════════
#  SKILL GAP & TRAINING ROUTES
# ═════════════════════════════════════════════════════════════

@app.get("/api/skill-gap/role/{role_name}", tags=["Skill Analysis"])
async def skill_gap_for_role(
    role_name: str,
    current_user: dict = Depends(get_current_user),
):
    """Get skill-gap analysis for the current student vs a named role (e.g. 'Backend Developer')."""
    student_id = current_user["sub"]
    result = analyze_skill_gap_for_role(student_id, role_name)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/skill-gap/{drive_id}", tags=["Skill Analysis"])
async def skill_gap(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get skill-gap analysis for the current student vs a drive."""
    student_id = current_user["sub"]
    result = analyze_skill_gap(student_id, drive_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@app.get("/api/training", tags=["Training"])
async def list_training_resources(current_user: dict = Depends(get_current_user)):
    """Get all available training resources."""
    return get_all_training_resources()


@app.post("/api/training", tags=["Training"])
async def create_training_resource(
    resource: TrainingResourceCreate,
    admin: dict = Depends(require_admin),
):
    """Add a new training resource (video, blog, course, etc.). Admin-only."""
    resp = supabase.table("training_resources").insert({
        "skill": resource.skill,
        "title": resource.title,
        "link": resource.link,
        "type": resource.type,
    }).execute()

    return {"message": "Training resource added", "resource": resp.data[0]}


@app.put("/api/training/{resource_id}", tags=["Training"])
async def update_training_resource(
    resource_id: int,
    resource: TrainingResourceCreate,
    admin: dict = Depends(require_admin),
):
    """Update a training resource. Admin-only."""
    resp = supabase.table("training_resources").update({
        "skill": resource.skill,
        "title": resource.title,
        "link": resource.link,
        "type": resource.type,
    }).eq("id", resource_id).execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Resource not found")

    return {"message": "Resource updated", "resource": resp.data[0]}


@app.delete("/api/training/{resource_id}", tags=["Training"])
async def delete_training_resource(
    resource_id: int,
    admin: dict = Depends(require_admin),
):
    """Delete a training resource. Admin-only."""
    supabase.table("training_resources").delete().eq("id", resource_id).execute()
    return {"message": "Resource deleted"}


# ═════════════════════════════════════════════════════════════
#  INTERVIEW EXPERIENCES ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/experiences", tags=["Experiences"])
async def create_experience(
    exp: InterviewExperienceCreate,
    admin: dict = Depends(require_admin),
):
    """Add interview experience / prep tips for a drive. Admin-only."""
    admin_id = admin["sub"]

    resp = supabase.table("interview_experiences").insert({
        "drive_id": exp.drive_id,
        "title": exp.title,
        "content": exp.content,
        "tips": exp.tips,
        "added_by": admin_id,
    }).execute()

    return {"message": "Experience added", "experience": resp.data[0]}


@app.get("/api/experiences", tags=["Experiences"])
async def list_all_experiences(current_user: dict = Depends(get_current_user)):
    """Get all interview experiences (all drives)."""
    resp = (
        supabase.table("interview_experiences")
        .select("*, drives(company_name, role)")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.get("/api/experiences/{drive_id}", tags=["Experiences"])
async def get_drive_experiences(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get interview experiences for a specific drive."""
    resp = (
        supabase.table("interview_experiences")
        .select("*, drives(company_name, role)")
        .eq("drive_id", drive_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.delete("/api/experiences/{experience_id}", tags=["Experiences"])
async def delete_experience(
    experience_id: int,
    admin: dict = Depends(require_admin),
):
    """Delete an interview experience. Admin-only."""
    supabase.table("interview_experiences").delete().eq("id", experience_id).execute()
    return {"message": "Experience deleted"}


# ═════════════════════════════════════════════════════════════
#  STUDENT REVIEWS ROUTES
# ═════════════════════════════════════════════════════════════

@app.post("/api/reviews", tags=["Reviews"])
async def create_review(
    review: StudentReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a review for a company. Only placed students may review.
    """
    student_id = current_user["sub"]

    # Verify student has been placed (has an offer or Placed status)
    offers_resp = (
        supabase.table("offers")
        .select("id")
        .eq("student_id", student_id)
        .execute()
    )
    if not offers_resp.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only placed students can write reviews",
        )

    resp = supabase.table("student_reviews").insert({
        "student_id": student_id,
        "drive_id": review.drive_id,
        "company": review.company,
        "rating": review.rating,
        "content": review.content,
    }).execute()

    return {"message": "Review submitted", "review": resp.data[0]}


@app.get("/api/reviews", tags=["Reviews"])
async def list_all_reviews(current_user: dict = Depends(get_current_user)):
    """Get all student reviews."""
    resp = (
        supabase.table("student_reviews")
        .select("*, users(name, branch), drives(company_name, role)")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.get("/api/reviews/company/{company_name}", tags=["Reviews"])
async def get_company_reviews(
    company_name: str,
    current_user: dict = Depends(get_current_user),
):
    """Get reviews for a specific company."""
    resp = (
        supabase.table("student_reviews")
        .select("*, users(name, branch)")
        .ilike("company", f"%{company_name}%")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.get("/api/reviews/drive/{drive_id}", tags=["Reviews"])
async def get_drive_reviews(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get reviews linked to a specific drive."""
    resp = (
        supabase.table("student_reviews")
        .select("*, users(name, branch)")
        .eq("drive_id", drive_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@app.delete("/api/reviews/{review_id}", tags=["Reviews"])
async def delete_review(
    review_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete a review (own review or admin)."""
    # Check ownership or admin
    if current_user.get("role") != "admin":
        review_resp = (
            supabase.table("student_reviews")
            .select("student_id")
            .eq("id", review_id)
            .single()
            .execute()
        )
        if review_resp.data and review_resp.data["student_id"] != current_user["sub"]:
            raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("student_reviews").delete().eq("id", review_id).execute()
    return {"message": "Review deleted"}


# ═════════════════════════════════════════════════════════════
#  EXCEL EXPORT ROUTE
# ═════════════════════════════════════════════════════════════

@app.get("/api/export-shortlisted/{drive_id}", tags=["Export"])
async def export_shortlisted(
    drive_id: int,
    admin: dict = Depends(require_admin),
):
    """Export shortlisted students as Excel. Admin-only."""
    excel_bytes = generate_shortlisted_excel(drive_id)

    if not excel_bytes:
        raise HTTPException(
            status_code=404,
            detail="No shortlisted students found for this drive",
        )

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
    """Get analytics data for the admin dashboard."""

    students_resp = (
        supabase.table("users")
        .select("id, branch", count="exact")
        .eq("role", "student")
        .execute()
    )
    total_students = students_resp.count or 0

    drives_resp = (
        supabase.table("drives")
        .select("id", count="exact")
        .execute()
    )
    total_drives = drives_resp.count or 0

    shortlisted_resp = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("status", "Shortlisted")
        .execute()
    )
    total_shortlisted = shortlisted_resp.count or 0

    offers_resp = (
        supabase.table("offers")
        .select("id, student_id", count="exact")
        .execute()
    )
    total_offers = offers_resp.count or 0

    placement_rate = 0.0
    if total_students > 0:
        unique_placed = len(set(o["student_id"] for o in (offers_resp.data or [])))
        placement_rate = round((unique_placed / total_students) * 100, 2)

    branch_stats = {}
    for s in (students_resp.data or []):
        branch = s.get("branch", "Unknown") or "Unknown"
        branch_stats[branch] = branch_stats.get(branch, 0) + 1

    skill_dist = {}
    resumes_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills")
        .execute()
    )
    for r in (resumes_resp.data or []):
        for skill in (r.get("extracted_skills") or []):
            skill_dist[skill] = skill_dist.get(skill, 0) + 1

    # ── Year-wise stats ──
    # Drives per year
    all_drives = (
        supabase.table("drives")
        .select("id, created_at")
        .execute()
    ).data or []

    # Offers per year
    all_offers = (
        supabase.table("offers")
        .select("id, student_id, offer_date")
        .execute()
    ).data or []

    # Placed applications per year
    placed_apps = (
        supabase.table("applications")
        .select("id, applied_at")
        .eq("status", "Placed")
        .execute()
    ).data or []

    year_wise_stats = {}
    for d in all_drives:
        year = str(d.get("created_at", "")[:4]) if d.get("created_at") else "Unknown"
        if year not in year_wise_stats:
            year_wise_stats[year] = {"drives": 0, "offers": 0, "placed": 0}
        year_wise_stats[year]["drives"] += 1

    for o in all_offers:
        year = str(o.get("offer_date", "")[:4]) if o.get("offer_date") else "Unknown"
        if year not in year_wise_stats:
            year_wise_stats[year] = {"drives": 0, "offers": 0, "placed": 0}
        year_wise_stats[year]["offers"] += 1

    for a in placed_apps:
        year = str(a.get("applied_at", "")[:4]) if a.get("applied_at") else "Unknown"
        if year not in year_wise_stats:
            year_wise_stats[year] = {"drives": 0, "offers": 0, "placed": 0}
        year_wise_stats[year]["placed"] += 1

    return AnalyticsResponse(
        total_students=total_students,
        total_drives=total_drives,
        total_shortlisted=total_shortlisted,
        total_offers=total_offers,
        placement_rate=placement_rate,
        branch_stats=branch_stats,
        skill_distribution=skill_dist,
        year_wise_stats=dict(sorted(year_wise_stats.items())),
    )


# ═════════════════════════════════════════════════════════════
#  DRIVE HISTORY ROUTE
# ═════════════════════════════════════════════════════════════

@app.get("/api/drives/history", tags=["Drives"])
async def get_drive_history(admin: dict = Depends(require_admin)):
    """
    Get all drives with per-drive stats:
    applied, shortlisted, offered, placed counts.
    Drives are tagged as Upcoming / Ongoing / Closed by deadline.
    Admin-only.
    """
    from datetime import datetime, timezone

    drives_resp = (
        supabase.table("drives")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    drives = drives_resp.data or []

    # Fetch all application status counts in one query
    apps_resp = (
        supabase.table("applications")
        .select("drive_id, status")
        .execute()
    )
    apps = apps_resp.data or []

    # Group counts per drive
    from collections import defaultdict
    counts = defaultdict(lambda: {"applied": 0, "shortlisted": 0, "offered": 0, "placed": 0})
    for a in apps:
        did = a["drive_id"]
        s = (a.get("status") or "").lower()
        if s == "applied":
            counts[did]["applied"] += 1
        elif s == "shortlisted":
            counts[did]["shortlisted"] += 1
        elif s == "offered":
            counts[did]["offered"] += 1
        elif s == "placed":
            counts[did]["placed"] += 1

    now = datetime.now(timezone.utc)
    history = []
    for d in drives:
        deadline_str = d.get("deadline")
        if deadline_str:
            try:
                dl = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                if dl > now:
                    drive_status = "Upcoming"
                else:
                    drive_status = "Closed"
            except Exception:
                drive_status = "Unknown"
        else:
            drive_status = "Ongoing"

        c = counts[d["id"]]
        history.append({
            "id": d["id"],
            "company_name": d["company_name"],
            "role": d["role"],
            "deadline": d.get("deadline"),
            "package": d.get("package"),
            "eligibility_cgpa": d.get("eligibility_cgpa"),
            "required_skills": d.get("required_skills", []),
            "status": drive_status,
            "applied": c["applied"],
            "shortlisted": c["shortlisted"],
            "offered": c["offered"],
            "placed": c["placed"],
            "created_at": d.get("created_at"),
        })

    return history


# ═════════════════════════════════════════════════════════════
#  ALL OFFERS ROUTE (with filters)
# ═════════════════════════════════════════════════════════════

@app.get("/api/offers/all", tags=["Offers"])
async def get_all_offers(
    company: str = None,
    branch: str = None,
    min_package: float = None,
    max_package: float = None,
    from_date: str = None,
    to_date: str = None,
    admin: dict = Depends(require_admin),
):
    """
    Get all placement offers with student info.
    Supports filtering by company name, branch/department, package range, and date range.
    Admin-only.
    """
    query = (
        supabase.table("offers")
        .select("*, users(name, roll_no, email, branch, cgpa)")
        .order("offer_date", desc=True)
    )

    resp = query.execute()
    offers = resp.data or []

    # Apply filters in Python (Supabase free tier has limited query operators)
    if company:
        offers = [o for o in offers if company.lower() in (o.get("company") or "").lower()]
    if branch:
        offers = [o for o in offers if branch.lower() in ((o.get("users") or {}).get("branch") or "").lower()]
    if min_package is not None:
        offers = [o for o in offers if (o.get("package") or 0) >= min_package]
    if max_package is not None:
        offers = [o for o in offers if (o.get("package") or 0) <= max_package]
    if from_date:
        offers = [o for o in offers if (o.get("offer_date") or "") >= from_date]
    if to_date:
        offers = [o for o in offers if (o.get("offer_date") or "") <= to_date]

    return offers


# ═════════════════════════════════════════════════════════════
#  DRIVE STAGES ROUTES
# ═════════════════════════════════════════════════════════════

DEFAULT_STAGES = ["Shortlisted", "Exam", "Interview", "Offered"]


@app.get("/api/drives/{drive_id}/stages", tags=["Workflow"])
async def get_drive_stages(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Get all workflow stages for a drive, ordered by stage_order."""
    resp = (
        supabase.table("drive_stages")
        .select("*")
        .eq("drive_id", drive_id)
        .order("stage_order")
        .execute()
    )
    return resp.data or []


@app.post("/api/drives/{drive_id}/stages", tags=["Workflow"])
async def create_drive_stage(
    drive_id: int,
    body: dict,
    admin: dict = Depends(require_admin),
):
    """
    Add a workflow stage to a drive.
    Body: { name: str, stage_order: int }
    If no stages exist yet, calling this with init_defaults=true
    seeds the 4 default stages first.
    Admin-only.
    """
    # Check if this is a request to seed defaults
    if body.get("init_defaults"):
        existing = (
            supabase.table("drive_stages")
            .select("id")
            .eq("drive_id", drive_id)
            .execute()
        )
        if not existing.data:
            rows = [
                {"drive_id": drive_id, "name": n, "stage_order": i + 1}
                for i, n in enumerate(DEFAULT_STAGES)
            ]
            supabase.table("drive_stages").insert(rows).execute()
        return {"message": "Default stages initialised"}

    # Otherwise add a single custom stage
    name = body.get("name", "").strip()
    order = body.get("stage_order")
    if not name or order is None:
        raise HTTPException(status_code=400, detail="name and stage_order are required")

    resp = supabase.table("drive_stages").insert({
        "drive_id": drive_id,
        "name": name,
        "stage_order": order,
    }).execute()

    return {"message": "Stage added", "stage": resp.data[0]}


@app.delete("/api/drives/{drive_id}/stages/{stage_id}", tags=["Workflow"])
async def delete_drive_stage(
    drive_id: int,
    stage_id: int,
    admin: dict = Depends(require_admin),
):
    """Delete a specific stage from a drive. Admin-only."""
    supabase.table("drive_stages").delete().eq("id", stage_id).eq("drive_id", drive_id).execute()
    return {"message": "Stage deleted"}


# ═════════════════════════════════════════════════════════════
#  STAGE PROGRESS ROUTES
# ═════════════════════════════════════════════════════════════

@app.get("/api/stages/{stage_id}/progress", tags=["Workflow"])
async def get_stage_progress(
    stage_id: int,
    admin: dict = Depends(require_admin),
):
    """
    Get all students and their status for a specific stage.
    Only includes students who are Shortlisted (or higher) on the drive.
    Auto-creates Pending records for any shortlisted student not yet tracked.
    Admin-only.
    """
    # Fetch the stage to get drive_id
    stage_resp = (
        supabase.table("drive_stages")
        .select("drive_id, name")
        .eq("id", stage_id)
        .single()
        .execute()
    )
    if not stage_resp.data:
        raise HTTPException(status_code=404, detail="Stage not found")

    drive_id = stage_resp.data["drive_id"]

    # Fetch all shortlisted/offered/placed applications for this drive
    apps_resp = (
        supabase.table("applications")
        .select("id, student_id, status, ai_score, users(name, roll_no, email, branch, cgpa)")
        .eq("drive_id", drive_id)
        .in_("status", ["Shortlisted", "Offered", "Placed"])
        .execute()
    )
    applications = apps_resp.data or []

    if not applications:
        return []

    app_ids = [a["id"] for a in applications]

    # Fetch existing progress records for this stage
    existing_resp = (
        supabase.table("stage_progress")
        .select("*")
        .eq("stage_id", stage_id)
        .execute()
    )
    existing = {e["application_id"]: e for e in (existing_resp.data or [])}

    # Auto-create Pending records for apps not yet tracked
    missing = [aid for aid in app_ids if aid not in existing]
    if missing:
        new_rows = [{"stage_id": stage_id, "application_id": aid, "status": "Pending"} for aid in missing]
        new_resp = supabase.table("stage_progress").insert(new_rows).execute()
        for row in (new_resp.data or []):
            existing[row["application_id"]] = row

    # Merge app info with progress status
    result = []
    for a in applications:
        prog = existing.get(a["id"], {})
        student = a.get("users", {})
        result.append({
            "progress_id": prog.get("id"),
            "application_id": a["id"],
            "student_id": a["student_id"],
            "name": student.get("name"),
            "roll_no": student.get("roll_no"),
            "email": student.get("email"),
            "branch": student.get("branch"),
            "cgpa": student.get("cgpa"),
            "ai_score": a.get("ai_score"),
            "stage_status": prog.get("status", "Pending"),
        })

    return result


@app.post("/api/stages/{stage_id}/progress", tags=["Workflow"])
async def update_stage_progress(
    stage_id: int,
    body: dict,
    admin: dict = Depends(require_admin),
):
    """
    Bulk-update student stage statuses and send emails.
    Body: {
        updates: [{ application_id: int, status: "Cleared"|"Eliminated" }, ...]
    }
    For each update, upserts stage_progress and sends a stage email.
    Admin-only.
    """
    updates = body.get("updates", [])
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    # Fetch stage + drive info for email
    stage_resp = (
        supabase.table("drive_stages")
        .select("name, drive_id")
        .eq("id", stage_id)
        .single()
        .execute()
    )
    if not stage_resp.data:
        raise HTTPException(status_code=404, detail="Stage not found")

    stage_name = stage_resp.data["name"]
    drive_id = stage_resp.data["drive_id"]

    drive_resp = (
        supabase.table("drives")
        .select("company_name")
        .eq("id", drive_id)
        .single()
        .execute()
    )
    company_name = drive_resp.data["company_name"] if drive_resp.data else "Company"

    emailed = 0
    updated = 0

    for u in updates:
        app_id = u.get("application_id")
        new_status = u.get("status")

        if not app_id or new_status not in ("Cleared", "Eliminated", "Pending"):
            continue

        # Upsert stage_progress
        supabase.table("stage_progress").upsert({
            "stage_id": stage_id,
            "application_id": app_id,
            "status": new_status,
            "updated_at": "now()",
        }, on_conflict="stage_id,application_id").execute()

        updated += 1

        # Send email for Cleared / Eliminated (not Pending)
        if new_status in ("Cleared", "Eliminated"):
            app_resp = (
                supabase.table("applications")
                .select("users(name, email)")
                .eq("id", app_id)
                .single()
                .execute()
            )
            if app_resp.data:
                student = app_resp.data.get("users", {})
                if student.get("email"):
                    sent = send_stage_email(
                        to_email=student["email"],
                        student_name=student.get("name", "Student"),
                        company_name=company_name,
                        stage_name=stage_name,
                        status=new_status,
                    )
                    if sent:
                        emailed += 1

    return {
        "message": f"Updated {updated} records, sent {emailed} emails",
        "updated": updated,
        "emails_sent": emailed,
    }


# ═════════════════════════════════════════════════════════════
#  AI INSIGHTS ROUTES
# ═════════════════════════════════════════════════════════════

# ── Resume Analysis ──────────────────────────────────────────

@app.post("/api/resume/{resume_id}/analyze", tags=["AI Insights"])
async def trigger_resume_analysis(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Run full AI analysis on a specific resume.
    Returns resume_score (0–100), improvement suggestions, strength areas,
    section detection, and component scores.
    """
    result = analyze_resume_by_id(resume_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/resume/{resume_id}/analysis", tags=["AI Insights"])
async def get_resume_analysis(
    resume_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve cached AI analysis for a resume.
    Re-runs analysis if not yet computed.
    """
    resp = (
        supabase.table("resume_metadata")
        .select("id, resume_score, analysis_data, extracted_skills, extracted_projects")
        .eq("id", resume_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resp.data.get("analysis_data"):
        return {"resume_id": resume_id, **resp.data["analysis_data"]}

    # Compute on demand if not cached
    return analyze_resume_by_id(resume_id)


# ── Job Match Scoring ─────────────────────────────────────────

@app.get("/api/drives/match-all", tags=["AI Insights"])
async def job_match_all_drives(
    current_user: dict = Depends(get_current_user),
):
    """
    Compute match scores for the current student against ALL drives.
    Returns list sorted by match_score descending.
    """
    student_id = current_user["sub"]
    return get_match_all_drives(student_id)


@app.get("/api/drives/{drive_id}/match", tags=["AI Insights"])
async def job_match_score(
    drive_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Compute job match score for the current student vs a specific drive.
    Returns match_score (0–100), matched/missing skills, and explanation.
    """
    student_id = current_user["sub"]
    result = get_match_for_student_drive(student_id, drive_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ── Placement Prediction ──────────────────────────────────────

@app.get("/api/ai/predict-placement", tags=["AI Insights"])
async def placement_prediction(
    current_user: dict = Depends(get_current_user),
):
    """
    Predict placement probability for the current student.
    Returns probability (0–100%), confidence level, helping/hurting factors,
    and recommended actions.
    """
    student_id = current_user["sub"]
    return predict_placement(student_id)


@app.get("/api/admin/predict-batch/{drive_id}", tags=["AI Insights"])
async def placement_prediction_batch(
    drive_id: int,
    admin: dict = Depends(require_admin),
):
    """
    Predict placement probability for all applicants of a drive.
    Returns list sorted by probability descending. Admin-only.
    """
    return batch_predict(drive_id)


# ── Smart Recommendations ─────────────────────────────────────

@app.get("/api/recommendations/drives", tags=["Recommendations"])
async def drive_recommendations(
    current_user: dict = Depends(get_current_user),
):
    """
    Return top 5 placement drives recommended for the current student
    based on skill match, CGPA eligibility, and resume quality.
    """
    student_id = current_user["sub"]
    return recommend_drives(student_id, top_n=5)


@app.get("/api/recommendations/training", tags=["Recommendations"])
async def training_recommendations(
    current_user: dict = Depends(get_current_user),
):
    """
    Return personalized training resources for the student's skill gaps
    ranked by how many drives require each missing skill.
    """
    student_id = current_user["sub"]
    return recommend_training(student_id, top_n=10)


@app.get("/api/recommendations/experiences", tags=["Recommendations"])
async def experience_recommendations(
    current_user: dict = Depends(get_current_user),
):
    """
    Return interview experiences for companies where the student
    has a high job match score.
    """
    student_id = current_user["sub"]
    return recommend_experiences(student_id, top_n=5)


@app.get("/api/recommendations/all", tags=["Recommendations"])
async def all_recommendations(
    current_user: dict = Depends(get_current_user),
):
    """
    Combined recommendation endpoint: drives + training + experiences.
    Suitable for the student dashboard recommendations panel.
    """
    student_id = current_user["sub"]
    return get_all_recommendations(student_id)


# ── Advanced Admin Analytics ──────────────────────────────────

@app.get("/api/admin/analytics/trends", tags=["Advanced Analytics"])
async def analytics_trends(
    admin: dict = Depends(require_admin),
):
    """Placement trends over time (monthly). Admin-only."""
    return get_placement_trends()


@app.get("/api/admin/analytics/skill-demand", tags=["Advanced Analytics"])
async def analytics_skill_demand(
    admin: dict = Depends(require_admin),
):
    """Top 15 skills demanded across all drives vs student coverage. Admin-only."""
    return get_skill_demand()


@app.get("/api/admin/analytics/branch-rates", tags=["Advanced Analytics"])
async def analytics_branch_rates(
    admin: dict = Depends(require_admin),
):
    """Branch-wise placement rates with placed/not-placed counts. Admin-only."""
    return get_branch_placement_rates()


@app.get("/api/admin/analytics/funnel", tags=["Advanced Analytics"])
async def analytics_funnel(
    admin: dict = Depends(require_admin),
):
    """Application funnel: Applied → Shortlisted → Placed. Admin-only."""
    return get_application_funnel()


@app.get("/api/admin/analytics/recruiters", tags=["Advanced Analytics"])
async def analytics_recruiter_activity(
    admin: dict = Depends(require_admin),
):
    """Per-company: drives posted, applications, shortlisted, placed. Admin-only."""
    return get_recruiter_activity()


@app.get("/api/admin/analytics/packages", tags=["Advanced Analytics"])
async def analytics_package_distribution(
    admin: dict = Depends(require_admin),
):
    """Offer package distribution histogram and min/max/avg. Admin-only."""
    return get_package_distribution()


@app.get("/api/admin/analytics/ai-overview", tags=["Advanced Analytics"])
async def analytics_ai_overview(
    admin: dict = Depends(require_admin),
):
    """AI-driven overview: avg resume scores, avg placement predictions, funnel. Admin-only."""
    return get_ai_overview()


# ═════════════════════════════════════════════════════════════
#  ROOT / HEALTH CHECK
# ═════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "app": "CampusHireAI",
        "version": "2.0.0",
    }
