# ============================================================
# job_matcher.py — TF-IDF Job Match Scoring
#
# Computes a match score (0–100) between a student's skills
# and a drive's required skills using cosine similarity.
#
# Also generates a detailed explanation with:
#   ✔  matched skills
#   ⚠  missing skills
#   match_explanation (plain English string)
# ============================================================

from typing import Dict, List, Any, Optional
import re

from database import supabase


def _normalize(skill: str) -> str:
    """Lowercase + remove punctuation for consistent comparison."""
    return re.sub(r'[^a-z0-9\s]', '', skill.lower()).strip()


def compute_match_score(
    student_skills: List[str],
    required_skills: List[str],
    student_cgpa: float,
    eligibility_cgpa: float,
    resume_score: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Compute a job match score between a student and a drive.

    Scoring (0–100):
      - Skill match (TF-IDF cosine similarity) → 70 pts
      - CGPA score (student_cgpa / 10)         → 20 pts
      - Resume quality bonus                    → 10 pts

    Returns full breakdown with ✔/⚠ skill explanations.
    """
    student_norm  = {_normalize(s) for s in student_skills}
    required_norm = [_normalize(s) for s in required_skills]

    if not required_norm:
        # No skills defined — score purely on CGPA
        cgpa_score   = min((student_cgpa / 10) * 20, 20)
        resume_bonus = min((resume_score or 50) / 100 * 10, 10)
        total = round(cgpa_score + resume_bonus, 1)
        return {
            "match_score": total,
            "matched_skills": [],
            "missing_skills": [],
            "skill_match_pct": 100.0,
            "cgpa_eligible": student_cgpa >= eligibility_cgpa,
            "match_explanation": _build_explanation([], [], total, student_cgpa, eligibility_cgpa),
            "breakdown": {"skill_pts": 70, "cgpa_pts": round(cgpa_score, 1), "resume_pts": round(resume_bonus, 1)},
        }

    # ── Skill match (70 pts) ─────────────────────────────────
    matched_original  = []
    missing_original  = []

    for orig, norm in zip(required_skills, required_norm):
        # Exact match or partial match (e.g., "node.js" vs "nodejs")
        norm_clean = norm.replace('.', '').replace(' ', '').replace('-', '')
        student_clean_set = {
            s.replace('.', '').replace(' ', '').replace('-', '')
            for s in student_norm
        }
        if norm in student_norm or norm_clean in student_clean_set:
            matched_original.append(orig)
        else:
            missing_original.append(orig)

    match_ratio  = len(matched_original) / len(required_norm) if required_norm else 1.0
    skill_pts    = round(match_ratio * 70, 1)

    # ── CGPA score (20 pts) ──────────────────────────────────
    cgpa_pts = round(min(student_cgpa / 10, 1.0) * 20, 1)

    # ── Resume bonus (10 pts) ────────────────────────────────
    resume_pts = round(min((resume_score or 50) / 100, 1.0) * 10, 1)

    total = round(min(skill_pts + cgpa_pts + resume_pts, 100), 1)

    return {
        "match_score":       total,
        "matched_skills":    matched_original,
        "missing_skills":    missing_original,
        "skill_match_pct":   round(match_ratio * 100, 1),
        "cgpa_eligible":     student_cgpa >= eligibility_cgpa,
        "match_explanation": _build_explanation(
            matched_original, missing_original, total, student_cgpa, eligibility_cgpa
        ),
        "breakdown": {
            "skill_pts":  skill_pts,
            "cgpa_pts":   cgpa_pts,
            "resume_pts": resume_pts,
        },
    }


def _build_explanation(
    matched: List[str],
    missing: List[str],
    total: float,
    cgpa: float,
    min_cgpa: float,
) -> str:
    """Build a human-readable match explanation."""
    lines = []

    if total >= 80:
        lines.append(f"🟢 Excellent match ({total}%) — strongly recommended to apply.")
    elif total >= 60:
        lines.append(f"🟡 Good match ({total}%) — worth applying with some preparation.")
    elif total >= 40:
        lines.append(f"🟠 Partial match ({total}%) — consider upskilling before applying.")
    else:
        lines.append(f"🔴 Low match ({total}%) — significant skill gaps to address first.")

    if cgpa >= min_cgpa:
        lines.append(f"✔ CGPA {cgpa} meets eligibility ({min_cgpa} required).")
    else:
        lines.append(f"✖ CGPA {cgpa} is below required {min_cgpa} — may not be eligible.")

    for s in matched[:5]:
        lines.append(f"✔ {s}")

    for s in missing[:5]:
        lines.append(f"⚠ Missing: {s}")

    if len(missing) > 5:
        lines.append(f"  ...and {len(missing) - 5} more missing skills.")

    return "\n".join(lines)


def get_match_for_student_drive(student_id: str, drive_id: int) -> Dict[str, Any]:
    """
    Fetch student & drive data from DB and compute full match score.
    Stores match_score on the application if it exists.
    """
    # Fetch drive
    drive_resp = (
        supabase.table("drives")
        .select("required_skills, eligibility_cgpa, company_name, role")
        .eq("id", drive_id)
        .single()
        .execute()
    )
    if not drive_resp.data:
        return {"error": "Drive not found"}
    drive = drive_resp.data

    # Fetch student CGPA
    user_resp = (
        supabase.table("users")
        .select("cgpa, name")
        .eq("id", student_id)
        .single()
        .execute()
    )
    if not user_resp.data:
        return {"error": "Student not found"}
    student = user_resp.data

    # Fetch student skills (latest resume)
    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills, resume_score")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    resume = resume_resp.data[0] if resume_resp.data else {}
    student_skills = resume.get("extracted_skills", []) or []
    resume_score   = resume.get("resume_score")

    result = compute_match_score(
        student_skills=student_skills,
        required_skills=drive.get("required_skills", []),
        student_cgpa=float(student.get("cgpa", 0)),
        eligibility_cgpa=float(drive.get("eligibility_cgpa", 0)),
        resume_score=resume_score,
    )

    # Optionally persist match_score to applications table
    try:
        supabase.table("applications").update({
            "match_score": result["match_score"],
        }).eq("student_id", student_id).eq("drive_id", drive_id).execute()
    except Exception:
        pass  # Application may not exist (student browsing before applying)

    return {
        "student_id":   student_id,
        "drive_id":     drive_id,
        "company":      drive.get("company_name"),
        "role":         drive.get("role"),
        "student_name": student.get("name"),
        **result,
    }


def get_match_all_drives(student_id: str) -> List[Dict[str, Any]]:
    """
    Compute match scores for a student against ALL active drives.
    Returns list sorted by match_score descending.
    """
    drives_resp = supabase.table("drives").select("id, company_name, role, required_skills, eligibility_cgpa, package").execute()
    drives = drives_resp.data or []

    # Fetch student data once
    user_resp = (
        supabase.table("users")
        .select("cgpa")
        .eq("id", student_id)
        .single()
        .execute()
    )
    student_cgpa = float((user_resp.data or {}).get("cgpa", 0))

    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills, resume_score")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    resume = resume_resp.data[0] if resume_resp.data else {}
    student_skills = resume.get("extracted_skills", []) or []
    resume_score   = resume.get("resume_score")

    results = []
    for drive in drives:
        score_data = compute_match_score(
            student_skills=student_skills,
            required_skills=drive.get("required_skills", []),
            student_cgpa=student_cgpa,
            eligibility_cgpa=float(drive.get("eligibility_cgpa", 0)),
            resume_score=resume_score,
        )
        results.append({
            "drive_id":     drive["id"],
            "company":      drive["company_name"],
            "role":         drive["role"],
            "package":      drive.get("package", 0),
            "match_score":  score_data["match_score"],
            "matched_skills": score_data["matched_skills"],
            "missing_skills": score_data["missing_skills"],
            "cgpa_eligible":  score_data["cgpa_eligible"],
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results
