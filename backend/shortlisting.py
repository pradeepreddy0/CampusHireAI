# ============================================================
# shortlisting.py — AI-Based Student Shortlisting
#
# Algorithm:
#   1. Fetch drive details (eligibility_cgpa, required_skills)
#   2. Get all applications for the drive
#   3. For each applied student:
#      a. Check CGPA >= eligibility_cgpa
#      b. Fetch their extracted_skills from resume_metadata
#      c. Calculate:
#         - Skill Score  = matched_skills / total_required_skills
#         - CGPA Score   = student_cgpa  / 10
#         - Final Score  = 0.6 * Skill Score + 0.4 * CGPA Score
#      d. If Final Score >= threshold → Shortlisted, else Rejected
#   4. Update each application's status and ai_score
# ============================================================

from typing import List, Dict
from database import supabase


def run_shortlisting(drive_id: int, threshold: float = 0.5) -> Dict:
    """
    Run the shortlisting algorithm for a specific drive.

    Args:
        drive_id:  ID of the placement drive
        threshold: Minimum final score to be shortlisted (0.0 to 1.0)

    Returns:
        dict with counts: { shortlisted: N, rejected: N, total: N, results: [...] }
    """
    # --- Step 1: Fetch drive details ---
    drive_resp = supabase.table("drives").select("*").eq("id", drive_id).single().execute()
    drive = drive_resp.data

    if not drive:
        return {"error": "Drive not found"}

    eligibility_cgpa = float(drive.get("eligibility_cgpa", 0))
    required_skills = drive.get("required_skills", [])

    # Normalize required skills to lowercase for comparison
    required_lower = [s.lower() for s in required_skills]

    # --- Step 2: Fetch all applications for this drive ---
    apps_resp = (
        supabase.table("applications")
        .select("*")
        .eq("drive_id", drive_id)
        .eq("status", "Applied")  # Only process new applications
        .execute()
    )
    applications = apps_resp.data or []

    shortlisted_count = 0
    rejected_count = 0
    results = []

    # --- Step 3: Process each application ---
    for app in applications:
        student_id = app["student_id"]

        # Fetch student profile for CGPA
        student_resp = (
            supabase.table("users")
            .select("cgpa, name, email, branch")
            .eq("id", student_id)
            .single()
            .execute()
        )
        student = student_resp.data

        if not student:
            continue

        student_cgpa = float(student.get("cgpa", 0))

        # Step 3a: CGPA eligibility check
        if student_cgpa < eligibility_cgpa:
            # Automatically reject if CGPA is below threshold
            supabase.table("applications").update({
                "status": "Rejected",
                "ai_score": 0.0,
            }).eq("id", app["id"]).execute()
            rejected_count += 1
            results.append({
                "student_id": student_id,
                "name": student.get("name"),
                "status": "Rejected",
                "reason": "CGPA below eligibility",
                "ai_score": 0.0,
            })
            continue

        # Step 3b: Fetch extracted skills from resume
        resume_resp = (
            supabase.table("resume_metadata")
            .select("extracted_skills")
            .eq("student_id", student_id)
            .single()
            .execute()
        )
        resume = resume_resp.data
        extracted_skills = resume.get("extracted_skills", []) if resume else []

        # Normalize extracted skills to lowercase
        extracted_lower = [s.lower() for s in extracted_skills]

        # Step 3c: Calculate scores
        if len(required_lower) > 0:
            matched = [s for s in required_lower if s in extracted_lower]
            skill_score = len(matched) / len(required_lower)
        else:
            # No skills required → full skill score
            skill_score = 1.0

        cgpa_score = student_cgpa / 10.0

        # Weighted final score: 60% skills + 40% CGPA
        final_score = round(0.6 * skill_score + 0.4 * cgpa_score, 4)

        # Step 3d: Determine status based on threshold
        if final_score >= threshold:
            new_status = "Shortlisted"
            shortlisted_count += 1
        else:
            new_status = "Rejected"
            rejected_count += 1

        # Update application in database
        supabase.table("applications").update({
            "status": new_status,
            "ai_score": final_score,
        }).eq("id", app["id"]).execute()

        results.append({
            "student_id": student_id,
            "name": student.get("name"),
            "email": student.get("email"),
            "branch": student.get("branch"),
            "cgpa": student_cgpa,
            "skill_score": round(skill_score, 4),
            "cgpa_score": round(cgpa_score, 4),
            "final_score": final_score,
            "status": new_status,
        })

    return {
        "drive_id": drive_id,
        "company": drive.get("company_name"),
        "threshold": threshold,
        "total": len(applications),
        "shortlisted": shortlisted_count,
        "rejected": rejected_count,
        "results": results,
    }
