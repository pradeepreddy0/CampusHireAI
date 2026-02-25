# ============================================================
# skill_analyzer.py — Skill Gap Analysis
#
# For a given student and drive, compares:
#   - Drive's required_skills
#   - Student's extracted_skills (from resume)
#
# Returns matched skills, missing skills, and relevant
# training resources for the missing ones.
# ============================================================

from typing import Dict, List
from database import supabase


def analyze_skill_gap(student_id: str, drive_id: int) -> Dict:
    """
    Compare a student's resume skills against a drive's requirements.

    Args:
        student_id: UUID of the student
        drive_id:   ID of the placement drive

    Returns:
        {
            "matched_skills":  ["Python", "SQL"],
            "missing_skills":  ["React", "Docker"],
            "match_percentage": 50.0,
            "training_resources": [...]
        }
    """
    # --- Fetch drive's required skills ---
    drive_resp = (
        supabase.table("drives")
        .select("required_skills, company_name, role")
        .eq("id", drive_id)
        .single()
        .execute()
    )
    drive = drive_resp.data

    if not drive:
        return {"error": "Drive not found"}

    required_skills = drive.get("required_skills", [])
    required_lower = [s.lower() for s in required_skills]

    # --- Fetch student's extracted skills ---
    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    resume = resume_resp.data
    extracted_skills = resume.get("extracted_skills", []) if resume else []
    extracted_lower = [s.lower() for s in extracted_skills]

    # --- Compare skills ---
    matched = [s for s in required_skills if s.lower() in extracted_lower]
    missing = [s for s in required_skills if s.lower() not in extracted_lower]

    # Calculate match percentage
    match_pct = (len(matched) / len(required_skills) * 100) if required_skills else 100.0

    # --- Fetch training resources for missing skills ---
    training = []
    if missing:
        # Query training_resources table for each missing skill
        for skill in missing:
            res = (
                supabase.table("training_resources")
                .select("*")
                .ilike("skill", f"%{skill}%")
                .execute()
            )
            if res.data:
                training.extend(res.data)

    return {
        "student_id": student_id,
        "drive_id": drive_id,
        "company": drive.get("company_name"),
        "role": drive.get("role"),
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percentage": round(match_pct, 2),
        "training_resources": training,
    }


def get_all_training_resources() -> List[Dict]:
    """
    Fetch all training resources from the database.
    Used on the Training Recommendations page.
    """
    resp = supabase.table("training_resources").select("*").execute()
    return resp.data or []
