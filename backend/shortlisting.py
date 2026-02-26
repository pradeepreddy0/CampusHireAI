# ============================================================
# shortlisting.py — AI-Based Student Shortlisting
#
# Algorithm:
#   1. Fetch drive details (eligibility_cgpa, required_skills, package)
#   2. Get all applications for the drive
#   3. For each applied student:
#      a. Check CGPA >= eligibility_cgpa
#      b. (Optional) 1.7× offer filter: skip if best_offer × 1.7 > drive_package
#      c. Fetch their extracted_skills from resume_metadata
#      d. Calculate:
#         - Skill Score  = matched_skills / total_required_skills
#         - CGPA Score   = student_cgpa  / 10
#         - Final Score  = 0.6 * Skill Score + 0.4 * CGPA Score
#      e. If Final Score >= threshold → Shortlisted, else Rejected
#   4. (Optional) Only keep top N students by final score
#   5. Update each application's status and ai_score
# ============================================================

from typing import List, Dict, Optional
from database import supabase


def run_shortlisting(
    drive_id: int,
    threshold: float = 0.5,
    top_n: Optional[int] = None,
    apply_offer_filter: bool = False,
) -> Dict:
    """
    Run the shortlisting algorithm for a specific drive.

    Args:
        drive_id:           ID of the placement drive
        threshold:          Minimum final score to be shortlisted (0.0 to 1.0)
        top_n:              Only shortlist the top N candidates (None = no limit)
        apply_offer_filter: If True, only consider students whose best existing
                            offer × 1.7 <= this drive's package

    Returns:
        dict with counts: { shortlisted, rejected, total, results }
    """
    # --- Step 1: Fetch drive details ---
    drive_resp = supabase.table("drives").select("*").eq("id", drive_id).single().execute()
    drive = drive_resp.data

    if not drive:
        return {"error": "Drive not found"}

    eligibility_cgpa = float(drive.get("eligibility_cgpa", 0))
    required_skills = drive.get("required_skills", [])
    drive_package = float(drive.get("package", 0) or 0)

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

    scored_candidates = []
    rejected_results = []

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
            supabase.table("applications").update({
                "status": "Rejected",
                "ai_score": 0.0,
            }).eq("id", app["id"]).execute()
            rejected_results.append({
                "student_id": student_id,
                "name": student.get("name"),
                "status": "Rejected",
                "reason": "CGPA below eligibility",
                "ai_score": 0.0,
            })
            continue

        # Step 3b: 1.7× Offer Filter (optional)
        if apply_offer_filter and drive_package > 0:
            offers_resp = (
                supabase.table("offers")
                .select("package")
                .eq("student_id", student_id)
                .order("package", desc=True)
                .limit(1)
                .execute()
            )
            best_offer = float(offers_resp.data[0]["package"]) if offers_resp.data else 0

            if best_offer > 0 and (best_offer * 1.7) > drive_package:
                # Student's existing offer is too high relative to this drive
                supabase.table("applications").update({
                    "status": "Rejected",
                    "ai_score": 0.0,
                }).eq("id", app["id"]).execute()
                rejected_results.append({
                    "student_id": student_id,
                    "name": student.get("name"),
                    "status": "Rejected",
                    "reason": f"Existing offer ({best_offer} LPA) × 1.7 > drive package ({drive_package} LPA)",
                    "ai_score": 0.0,
                })
                continue

        # Step 3c: Fetch extracted skills from resume
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

        # Step 3d: Calculate scores
        if len(required_lower) > 0:
            matched = [s for s in required_lower if s in extracted_lower]
            skill_score = len(matched) / len(required_lower)
        else:
            skill_score = 1.0

        cgpa_score = student_cgpa / 10.0
        final_score = round(0.6 * skill_score + 0.4 * cgpa_score, 4)

        scored_candidates.append({
            "app_id": app["id"],
            "student_id": student_id,
            "name": student.get("name"),
            "email": student.get("email"),
            "branch": student.get("branch"),
            "cgpa": student_cgpa,
            "skill_score": round(skill_score, 4),
            "cgpa_score": round(cgpa_score, 4),
            "final_score": final_score,
        })

    # --- Step 4: Sort by final score and apply top_n ---
    scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

    shortlisted_count = 0
    rejected_count = len(rejected_results)
    results = list(rejected_results)

    for i, candidate in enumerate(scored_candidates):
        # Apply threshold and top_n
        if candidate["final_score"] >= threshold and (top_n is None or i < top_n):
            new_status = "Shortlisted"
            shortlisted_count += 1
        else:
            new_status = "Rejected"
            rejected_count += 1

        # Update application in database
        supabase.table("applications").update({
            "status": new_status,
            "ai_score": candidate["final_score"],
        }).eq("id", candidate["app_id"]).execute()

        results.append({
            "student_id": candidate["student_id"],
            "name": candidate["name"],
            "email": candidate["email"],
            "branch": candidate["branch"],
            "cgpa": candidate["cgpa"],
            "skill_score": candidate["skill_score"],
            "cgpa_score": candidate["cgpa_score"],
            "final_score": candidate["final_score"],
            "status": new_status,
        })

    return {
        "drive_id": drive_id,
        "company": drive.get("company_name"),
        "threshold": threshold,
        "top_n": top_n,
        "offer_filter_applied": apply_offer_filter,
        "total": len(applications),
        "shortlisted": shortlisted_count,
        "rejected": rejected_count,
        "results": results,
    }
