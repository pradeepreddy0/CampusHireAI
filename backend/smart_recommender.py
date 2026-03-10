# ============================================================
# smart_recommender.py — Personalized Recommendations
#
# Three recommendation engines:
#
# 1. Drive Recommender
#    Ranks all drives by skill match + eligibility for a student.
#    Returns top 5 recommended drives with match scores.
#
# 2. Training Recommender
#    Maps student's missing skills (vs applied drives) to the
#    best training resources. Prioritizes high-demand gaps.
#
# 3. Experience Recommender
#    Returns interview experiences for companies where the
#    student has a high match score (≥ 60%).
# ============================================================

from typing import Dict, Any, List
import re

from database import supabase
from job_matcher import compute_match_score


def _normalize(s: str) -> str:
    return re.sub(r'[^a-z0-9\s]', '', s.lower()).strip()


def _get_student_profile(student_id: str) -> Dict[str, Any]:
    """Fetch student skills, CGPA, and applied drive ids."""
    user_resp = (
        supabase.table("users")
        .select("cgpa, branch")
        .eq("id", student_id)
        .single()
        .execute()
    )
    user = user_resp.data or {}

    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills, resume_score")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    resume = resume_resp.data[0] if resume_resp.data else {}

    apps_resp = (
        supabase.table("applications")
        .select("drive_id")
        .eq("student_id", student_id)
        .execute()
    )
    applied_ids = {a["drive_id"] for a in (apps_resp.data or [])}

    return {
        "cgpa":         float(user.get("cgpa", 0)),
        "branch":       user.get("branch", ""),
        "skills":       resume.get("extracted_skills", []) or [],
        "resume_score": resume.get("resume_score"),
        "applied_ids":  applied_ids,
    }


# ── 1. Drive Recommendations ─────────────────────────────────

def recommend_drives(student_id: str, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Return the top N drives ranked by compatibility with the student.
    Excludes drives the student has already applied to.

    Each result includes:
      - drive info
      - match_score (0–100)
      - matched_skills / missing_skills
      - why_recommended (reason string)
    """
    profile = _get_student_profile(student_id)

    drives_resp = (
        supabase.table("drives")
        .select("id, company_name, role, required_skills, eligibility_cgpa, package, deadline")
        .execute()
    )
    drives = drives_resp.data or []

    recommendations = []
    for drive in drives:
        if drive["id"] in profile["applied_ids"]:
            continue  # Skip already-applied drives

        match = compute_match_score(
            student_skills=profile["skills"],
            required_skills=drive.get("required_skills", []),
            student_cgpa=profile["cgpa"],
            eligibility_cgpa=float(drive.get("eligibility_cgpa", 0)),
            resume_score=profile["resume_score"],
        )

        if not match["cgpa_eligible"] and profile["cgpa"] > 0:
            continue  # Skip ineligible drives

        # Build reason string
        pct = match["match_score"]
        if pct >= 80:
            reason = f"Excellent fit — {len(match['matched_skills'])} of your skills match."
        elif pct >= 60:
            reason = f"Good fit — learn {', '.join(match['missing_skills'][:2]) or 'a few skills'} to maximize chances."
        elif pct >= 40:
            reason = f"Partial fit — {len(match['missing_skills'])} skills to bridge, worth exploring."
        else:
            reason = "Low match but CGPA eligible — consider for practice."

        recommendations.append({
            "drive_id":       drive["id"],
            "company":        drive["company_name"],
            "role":           drive["role"],
            "package":        drive.get("package", 0),
            "deadline":       drive.get("deadline"),
            "match_score":    match["match_score"],
            "matched_skills": match["matched_skills"],
            "missing_skills": match["missing_skills"],
            "cgpa_eligible":  match["cgpa_eligible"],
            "why_recommended": reason,
        })

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations[:top_n]


# ── 2. Training Recommendations ──────────────────────────────

def recommend_training(student_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Recommend training resources based on the student's skill gaps
    across all drives they are eligible for.

    Prioritizes:
      1. Skills missing from the most drives (high demand)
      2. Skills with available training resources
    """
    profile = _get_student_profile(student_id)
    student_skills_lower = {_normalize(s) for s in profile["skills"]}

    # Collect all required skills across all drives
    drives_resp = (
        supabase.table("drives")
        .select("required_skills, eligibility_cgpa")
        .execute()
    )
    drives = drives_resp.data or []

    skill_demand: Dict[str, int] = {}  # skill → how many drives need it
    for drive in drives:
        if float(drive.get("eligibility_cgpa", 0)) > profile["cgpa"]:
            continue
        for skill in (drive.get("required_skills", []) or []):
            norm = _normalize(skill)
            if norm not in student_skills_lower:
                skill_demand[skill] = skill_demand.get(skill, 0) + 1

    if not skill_demand:
        # Student has all skills — return general resources
        all_resources = supabase.table("training_resources").select("*").limit(top_n).execute()
        return [{**r, "priority": "General", "demand_count": 0} for r in (all_resources.data or [])]

    # Sort missing skills by demand count (most-needed first)
    sorted_gaps = sorted(skill_demand.items(), key=lambda x: x[1], reverse=True)

    collected = []
    seen_ids  = set()

    for skill, demand in sorted_gaps:
        if len(collected) >= top_n:
            break
        res_resp = (
            supabase.table("training_resources")
            .select("*")
            .ilike("skill", f"%{skill}%")
            .execute()
        )
        for resource in (res_resp.data or []):
            if resource["id"] not in seen_ids:
                seen_ids.add(resource["id"])
                collected.append({
                    **resource,
                    "gap_skill":    skill,
                    "demand_count": demand,
                    "priority":     "High" if demand >= 3 else "Medium" if demand >= 2 else "Low",
                })
            if len(collected) >= top_n:
                break

    return collected


# ── 3. Experience Recommendations ────────────────────────────

def recommend_experiences(student_id: str, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Recommend interview experiences relevant to the student.

    Logic:
      - Load all interview experiences linked to drives
      - Score those drives for the student using job_matcher
      - Return experiences for drives with match_score ≥ 50
        sorted by match score descending
    """
    profile = _get_student_profile(student_id)

    # Fetch all experiences with their linked drive info
    exp_resp = (
        supabase.table("interview_experiences")
        .select("*, drives(id, company_name, role, required_skills, eligibility_cgpa)")
        .order("created_at", desc=True)
        .execute()
    )
    experiences = exp_resp.data or []

    scored = []
    for exp in experiences:
        drive = exp.get("drives") or {}
        if not drive:
            # No drive linked — include with neutral score
            scored.append({**exp, "match_score": 50, "company": None, "role": None})
            continue

        match = compute_match_score(
            student_skills=profile["skills"],
            required_skills=drive.get("required_skills", []),
            student_cgpa=profile["cgpa"],
            eligibility_cgpa=float(drive.get("eligibility_cgpa", 0)),
            resume_score=profile["resume_score"],
        )

        if match["match_score"] >= 40 or not profile["skills"]:
            scored.append({
                **exp,
                "match_score": match["match_score"],
                "company":     drive.get("company_name"),
                "role":        drive.get("role"),
            })

    scored.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return scored[:top_n]


# ── 4. Combined Recommendations ──────────────────────────────

def get_all_recommendations(student_id: str) -> Dict[str, Any]:
    """
    Return all recommendation types in one call for the dashboard.
    """
    return {
        "recommended_drives":      recommend_drives(student_id, top_n=5),
        "recommended_training":    recommend_training(student_id, top_n=8),
        "recommended_experiences": recommend_experiences(student_id, top_n=4),
    }
