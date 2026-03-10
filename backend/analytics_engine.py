# ============================================================
# analytics_engine.py — Advanced Admin Analytics
#
# Computes rich analytics from the database:
#   - Placement trends over time
#   - Branch-wise placement rates
#   - Skill demand analysis (most-required skills across drives)
#   - Recruiter activity (companies, shortlisting rates)
#   - Application funnel (applied → shortlisted → placed)
#   - Offer package distribution (histogram)
# ============================================================

from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime

from database import supabase


def _safe_pct(numerator: int, denominator: int) -> float:
    return round((numerator / denominator * 100), 1) if denominator > 0 else 0.0


# ── 1. Placement Trends ──────────────────────────────────────

def get_placement_trends() -> Dict[str, Any]:
    """
    Returns month-by-month placement counts for the last 12 months.
    """
    offers_resp = supabase.table("offers").select("offer_date, package").execute()
    offers = offers_resp.data or []

    monthly: Dict[str, int] = defaultdict(int)
    monthly_packages: Dict[str, List[float]] = defaultdict(list)

    for offer in offers:
        date_str = offer.get("offer_date") or offer.get("created_at")
        if not date_str:
            continue
        try:
            dt = datetime.fromisoformat(date_str[:10])
            key = dt.strftime("%Y-%m")
            monthly[key] += 1
            if offer.get("package"):
                monthly_packages[key].append(float(offer["package"]))
        except Exception:
            continue

    # Build sorted series (last 12 months)
    sorted_months = sorted(monthly.keys())[-12:]
    trend_data = []
    for month in sorted_months:
        pkgs = monthly_packages.get(month, [])
        trend_data.append({
            "month":        month,
            "placements":   monthly[month],
            "avg_package":  round(sum(pkgs) / len(pkgs), 2) if pkgs else 0,
        })

    return {
        "trend_data":    trend_data,
        "total_offers":  len(offers),
        "months_tracked": len(sorted_months),
    }


# ── 2. Branch-Wise Placement Rates ───────────────────────────

def get_branch_placement_rates() -> List[Dict[str, Any]]:
    """
    Compute placement rate per branch.
    """
    # All students by branch
    students_resp = supabase.table("users").select("id, branch").eq("role", "student").execute()
    students = students_resp.data or []

    branch_totals: Dict[str, int] = defaultdict(int)
    for s in students:
        branch = (s.get("branch") or "Unknown").strip()
        branch_totals[branch] += 1

    # Placed students (have at least one offer)
    placed_resp = (
        supabase.table("offers")
        .select("student_id")
        .execute()
    )
    placed_ids = {o["student_id"] for o in (placed_resp.data or [])}

    # Placed per branch — join through users
    branch_placed: Dict[str, int] = defaultdict(int)
    for s in students:
        if s["id"] in placed_ids:
            branch = (s.get("branch") or "Unknown").strip()
            branch_placed[branch] += 1

    results = []
    for branch, total in sorted(branch_totals.items()):
        placed = branch_placed.get(branch, 0)
        results.append({
            "branch":         branch,
            "total_students": total,
            "placed":         placed,
            "not_placed":     total - placed,
            "placement_rate": _safe_pct(placed, total),
        })

    results.sort(key=lambda x: x["placement_rate"], reverse=True)
    return results


# ── 3. Skill Demand Analysis ─────────────────────────────────

def get_skill_demand() -> List[Dict[str, Any]]:
    """
    Count how many drives require each skill.
    Returns top 15 most in-demand skills.
    """
    drives_resp = supabase.table("drives").select("required_skills").execute()
    drives = drives_resp.data or []

    skill_count: Dict[str, int] = defaultdict(int)
    for drive in drives:
        for skill in (drive.get("required_skills", []) or []):
            if skill:
                key = skill.strip().title()
                skill_count[key] += 1

    # Also count student skill coverage
    resumes_resp = supabase.table("resume_metadata").select("extracted_skills").execute()
    student_skill_count: Dict[str, int] = defaultdict(int)
    for r in (resumes_resp.data or []):
        for skill in (r.get("extracted_skills", []) or []):
            if skill:
                student_skill_count[skill.strip().title()] += 1

    sorted_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:15]
    return [
        {
            "skill":            skill,
            "drive_demand":     count,
            "students_with":    student_skill_count.get(skill, 0),
            "gap":              max(count - student_skill_count.get(skill, 0), 0),
        }
        for skill, count in sorted_skills
    ]


# ── 4. Recruiter Activity ────────────────────────────────────

def get_recruiter_activity() -> List[Dict[str, Any]]:
    """
    Per-company: drives posted, applications received, shortlisted, placed.
    """
    drives_resp = supabase.table("drives").select("id, company_name, package").execute()
    drives = drives_resp.data or []

    company_stats: Dict[str, Dict[str, Any]] = {}
    for drive in drives:
        company = drive["company_name"]
        if company not in company_stats:
            company_stats[company] = {
                "company":       company,
                "drives_posted": 0,
                "applications":  0,
                "shortlisted":   0,
                "placed":        0,
                "avg_package":   [],
            }
        company_stats[company]["drives_posted"] += 1
        if drive.get("package"):
            company_stats[company]["avg_package"].append(float(drive["package"]))

        # Applications for this drive
        apps_resp = (
            supabase.table("applications")
            .select("status")
            .eq("drive_id", drive["id"])
            .execute()
        )
        for app in (apps_resp.data or []):
            company_stats[company]["applications"] += 1
            if app["status"] == "Shortlisted":
                company_stats[company]["shortlisted"] += 1
            elif app["status"] == "Placed":
                company_stats[company]["placed"] += 1

    results = []
    for company, stats in company_stats.items():
        pkgs = stats.pop("avg_package", [])
        results.append({
            **stats,
            "avg_package":       round(sum(pkgs) / len(pkgs), 2) if pkgs else 0,
            "shortlisting_rate": _safe_pct(stats["shortlisted"], stats["applications"]),
        })

    results.sort(key=lambda x: x["drives_posted"], reverse=True)
    return results


# ── 5. Application Funnel ────────────────────────────────────

def get_application_funnel() -> Dict[str, Any]:
    """
    Compute overall funnel: Applied → Shortlisted → Placed.
    """
    apps_resp = supabase.table("applications").select("status").execute()
    apps = apps_resp.data or []

    counts: Dict[str, int] = defaultdict(int)
    for app in apps:
        counts[app.get("status", "Applied")] += 1

    applied      = len(apps)
    shortlisted  = counts.get("Shortlisted", 0) + counts.get("Placed", 0)
    placed       = counts.get("Placed", 0)

    return {
        "applied":            applied,
        "shortlisted":        shortlisted,
        "placed":             placed,
        "rejected":           counts.get("Rejected", 0),
        "shortlist_rate":     _safe_pct(shortlisted, applied),
        "placement_rate":     _safe_pct(placed, applied),
        "conversion_rate":    _safe_pct(placed, shortlisted),
        "status_breakdown":   dict(counts),
    }


# ── 6. Package Distribution ──────────────────────────────────

def get_package_distribution() -> Dict[str, Any]:
    """
    Histogram of offer packages in LPA buckets.
    """
    offers_resp = supabase.table("offers").select("package").execute()
    packages = [float(o["package"]) for o in (offers_resp.data or []) if o.get("package")]

    buckets = {
        "0-5 LPA":   0,
        "5-10 LPA":  0,
        "10-20 LPA": 0,
        "20+ LPA":   0,
    }
    for pkg in packages:
        if pkg < 5:
            buckets["0-5 LPA"] += 1
        elif pkg < 10:
            buckets["5-10 LPA"] += 1
        elif pkg < 20:
            buckets["10-20 LPA"] += 1
        else:
            buckets["20+ LPA"] += 1

    return {
        "distribution":  buckets,
        "total_offers":  len(packages),
        "avg_package":   round(sum(packages) / len(packages), 2) if packages else 0,
        "max_package":   max(packages) if packages else 0,
        "min_package":   min(packages) if packages else 0,
    }


# ── 7. AI Insights Overview ──────────────────────────────────

def get_ai_overview() -> Dict[str, Any]:
    """
    Lightweight overview that amalgamates key AI-driven metrics.
    Used by the admin AI Insights dashboard tab.
    """
    # Avg resume score across all students
    resumes_resp = supabase.table("resume_metadata").select("resume_score").execute()
    scores = [float(r["resume_score"]) for r in (resumes_resp.data or []) if r.get("resume_score")]
    avg_resume_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Avg placement prediction
    users_resp = (
        supabase.table("users")
        .select("placement_prediction")
        .eq("role", "student")
        .execute()
    )
    preds = [float(u["placement_prediction"]) for u in (users_resp.data or []) if u.get("placement_prediction")]
    avg_prediction = round(sum(preds) / len(preds) * 100, 1) if preds else 0

    funnel = get_application_funnel()

    return {
        "avg_resume_score":       avg_resume_score,
        "avg_placement_prediction": avg_prediction,
        "students_analyzed":      len(scores),
        "placement_funnel":       funnel,
    }
