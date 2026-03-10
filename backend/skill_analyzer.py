# ============================================================
# skill_analyzer.py — Enhanced Skill Gap Analysis
#
# For a given student and drive, compares:
#   - Drive's required_skills
#   - Student's extracted_skills (from resume)
#
# Returns matched skills, missing skills, training resources,
# priority ranking, role-based roadmaps, and estimated
# learning durations for each gap.
# ============================================================

from typing import Dict, List
from database import supabase


# ── Role-Based Skill Roadmaps ────────────────────────────────
# Curated skill trees for common campus recruitment roles.
# Missing skills are ranked + augmented with these.
ROLE_ROADMAPS: Dict[str, Dict] = {
    "backend developer": {
        "core":       ["Python", "Node.js", "REST API", "SQL", "Git"],
        "advanced":   ["Docker", "Redis", "System Design", "PostgreSQL", "AWS"],
        "good_to_have": ["Kubernetes", "GraphQL", "Microservices", "CI/CD"],
        "learn_hours": {"Python": 40, "Node.js": 50, "REST API": 20, "SQL": 30, "Docker": 25},
    },
    "frontend developer": {
        "core":       ["HTML", "CSS", "JavaScript", "React", "Git"],
        "advanced":   ["TypeScript", "Tailwind", "Redux", "Testing", "Webpack"],
        "good_to_have": ["Vue", "Angular", "GraphQL", "Figma", "CI/CD"],
        "learn_hours": {"HTML": 15, "CSS": 20, "JavaScript": 60, "React": 50, "TypeScript": 30},
    },
    "full stack developer": {
        "core":       ["JavaScript", "React", "Node.js", "SQL", "REST API"],
        "advanced":   ["TypeScript", "Docker", "PostgreSQL", "Redis", "AWS"],
        "good_to_have": ["GraphQL", "Kubernetes", "CI/CD", "System Design"],
        "learn_hours": {"JavaScript": 60, "React": 50, "Node.js": 50, "SQL": 30, "Docker": 25},
    },
    "data scientist": {
        "core":       ["Python", "Pandas", "NumPy", "Machine Learning", "SQL"],
        "advanced":   ["Deep Learning", "TensorFlow", "PyTorch", "Data Visualization", "Statistics"],
        "good_to_have": ["NLP", "Computer Vision", "Spark", "Tableau", "Power BI"],
        "learn_hours": {"Python": 40, "Pandas": 25, "Machine Learning": 60, "SQL": 30, "TensorFlow": 50},
    },
    "machine learning engineer": {
        "core":       ["Python", "Machine Learning", "Deep Learning", "Mathematics", "Scikit-Learn"],
        "advanced":   ["TensorFlow", "PyTorch", "NLP", "Computer Vision", "Docker"],
        "good_to_have": ["MLOps", "AWS SageMaker", "Spark", "Kubernetes"],
        "learn_hours": {"Python": 40, "Machine Learning": 60, "Deep Learning": 70, "TensorFlow": 50},
    },
    "software engineer": {
        "core":       ["Python", "Java", "Data Structures", "Algorithms", "SQL", "Git"],
        "advanced":   ["System Design", "REST API", "Docker", "Cloud", "Testing"],
        "good_to_have": ["Kubernetes", "Microservices", "CI/CD", "Linux"],
        "learn_hours": {"Python": 40, "Java": 60, "Data Structures": 50, "System Design": 40},
    },
    "devops engineer": {
        "core":       ["Linux", "Docker", "Kubernetes", "CI/CD", "Git"],
        "advanced":   ["AWS", "Terraform", "Ansible", "Monitoring", "Shell Scripting"],
        "good_to_have": ["Python", "Security", "Networking", "CloudFormation"],
        "learn_hours": {"Docker": 30, "Kubernetes": 50, "AWS": 60, "CI/CD": 30, "Linux": 25},
    },
    "ai engineer": {
        "core":       ["Python", "Machine Learning", "Deep Learning", "NLP", "Mathematics"],
        "advanced":   ["LLMs", "GenAI", "TensorFlow", "PyTorch", "Vector Databases"],
        "good_to_have": ["MLOps", "FastAPI", "Docker", "AWS"],
        "learn_hours": {"Python": 40, "Machine Learning": 60, "NLP": 50, "Deep Learning": 70},
    },
    "analyst": {
        "core":       ["SQL", "Excel", "Python", "Data Analysis", "Statistics"],
        "advanced":   ["Power BI", "Tableau", "Pandas", "Data Visualization", "Reporting"],
        "good_to_have": ["Machine Learning", "Spark", "Looker", "Business Intelligence"],
        "learn_hours": {"SQL": 30, "Excel": 15, "Python": 40, "Power BI": 25},
    },
    "cloud engineer": {
        "core":       ["AWS", "Azure", "GCP", "Linux", "Networking"],
        "advanced":   ["Terraform", "Kubernetes", "Docker", "Security", "Cost Optimization"],
        "good_to_have": ["Python", "Ansible", "CloudFormation", "Monitoring"],
        "learn_hours": {"AWS": 60, "Linux": 25, "Terraform": 35, "Docker": 30},
    },
}


def _find_role_roadmap(role_name: str) -> Dict:
    """Fuzzy-match a role name to the nearest roadmap."""
    role_lower = role_name.lower()
    # Try exact match first
    if role_lower in ROLE_ROADMAPS:
        return ROLE_ROADMAPS[role_lower]
    # Try partial keyword match
    for key, roadmap in ROLE_ROADMAPS.items():
        if any(word in role_lower for word in key.split()):
            return roadmap
    # Default to software engineer
    return ROLE_ROADMAPS["software engineer"]


def _prioritize_missing(missing_skills: List[str], roadmap: Dict) -> List[Dict]:
    """
    Rank missing skills by priority (core > advanced > good_to_have).
    Attaches estimated learning hours.
    """
    core        = {s.lower() for s in roadmap.get("core", [])}
    advanced    = {s.lower() for s in roadmap.get("advanced", [])}
    hours_map   = {k.lower(): v for k, v in roadmap.get("learn_hours", {}).items()}

    prioritized = []
    for skill in missing_skills:
        skill_lower = skill.lower()
        if skill_lower in core:
            priority = "High"
            priority_num = 1
        elif skill_lower in advanced:
            priority = "Medium"
            priority_num = 2
        else:
            priority = "Low"
            priority_num = 3

        prioritized.append({
            "skill":       skill,
            "priority":    priority,
            "_priority_num": priority_num,
            "est_hours":   hours_map.get(skill_lower, 20),
        })

    prioritized.sort(key=lambda x: x["_priority_num"])
    for p in prioritized:
        del p["_priority_num"]
    return prioritized


def analyze_skill_gap(student_id: str, drive_id: int) -> Dict:
    """
    Compare a student's resume skills against a drive's requirements.
    Enhanced with priority ranking, learning hours, roadmap suggestions.
    """
    # Fetch drive
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
    required_lower  = [s.lower() for s in required_skills]

    # Fetch student skills
    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    resume = resume_resp.data[0] if resume_resp.data else {}
    extracted_skills = resume.get("extracted_skills", []) if resume else []
    extracted_lower  = [s.lower() for s in extracted_skills]

    # Compare
    matched = [s for s in required_skills if s.lower() in extracted_lower]
    missing = [s for s in required_skills if s.lower() not in extracted_lower]

    match_pct = (len(matched) / len(required_skills) * 100) if required_skills else 100.0

    # Get role roadmap & prioritize missing skills
    roadmap  = _find_role_roadmap(drive.get("role", "Software Engineer"))
    missing_prioritized = _prioritize_missing(missing, roadmap)

    # Fetch training resources for missing skills
    training = []
    seen_ids = set()
    for skill in missing[:6]:  # limit queries
        res = (
            supabase.table("training_resources")
            .select("*")
            .ilike("skill", f"%{skill}%")
            .execute()
        )
        for resource in (res.data or []):
            if resource["id"] not in seen_ids:
                seen_ids.add(resource["id"])
                training.append(resource)

    # Estimate total learning hours for missing skills
    total_est_hours = sum(m["est_hours"] for m in missing_prioritized)

    return {
        "student_id":        student_id,
        "drive_id":          drive_id,
        "company":           drive.get("company_name"),
        "role":              drive.get("role"),
        "matched_skills":    matched,
        "missing_skills":    missing,
        "missing_prioritized": missing_prioritized,
        "match_percentage":  round(match_pct, 2),
        "total_est_hours":   total_est_hours,
        "training_resources": training,
        "roadmap": {
            "core_skills":   roadmap.get("core", []),
            "advanced":      roadmap.get("advanced", []),
            "good_to_have":  roadmap.get("good_to_have", []),
        },
    }


def analyze_skill_gap_for_role(student_id: str, role_name: str) -> Dict:
    """
    Skill gap analysis against a named role (not a specific drive).
    Uses the curated role roadmap.
    """
    roadmap = _find_role_roadmap(role_name)

    # Fetch student skills
    resume_resp = (
        supabase.table("resume_metadata")
        .select("extracted_skills")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .limit(1)
        .execute()
    )
    resume = resume_resp.data[0] if resume_resp.data else {}
    extracted_skills = resume.get("extracted_skills", []) if resume else []
    extracted_lower  = {s.lower() for s in extracted_skills}

    all_role_skills = roadmap.get("core", []) + roadmap.get("advanced", [])

    matched = [s for s in all_role_skills if s.lower() in extracted_lower]
    missing = [s for s in all_role_skills if s.lower() not in extracted_lower]

    match_pct = (len(matched) / len(all_role_skills) * 100) if all_role_skills else 100.0

    missing_prioritized = _prioritize_missing(missing, roadmap)
    total_est_hours     = sum(m["est_hours"] for m in missing_prioritized)

    # Fetch training resources for top 5 missing skills
    training = []
    seen_ids = set()
    for item in missing_prioritized[:5]:
        res = (
            supabase.table("training_resources")
            .select("*")
            .ilike("skill", f"%{item['skill']}%")
            .execute()
        )
        for resource in (res.data or []):
            if resource["id"] not in seen_ids:
                seen_ids.add(resource["id"])
                training.append(resource)

    return {
        "student_id":          student_id,
        "role":                role_name,
        "matched_skills":      matched,
        "missing_skills":      missing,
        "missing_prioritized": missing_prioritized,
        "match_percentage":    round(match_pct, 2),
        "total_est_hours":     total_est_hours,
        "training_resources":  training,
        "roadmap": {
            "core_skills":   roadmap.get("core", []),
            "advanced":      roadmap.get("advanced", []),
            "good_to_have":  roadmap.get("good_to_have", []),
        },
    }


def get_all_training_resources() -> list:
    """Fetch all training resources from the database."""
    resp = supabase.table("training_resources").select("*").execute()
    return resp.data or []
