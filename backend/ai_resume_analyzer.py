# ============================================================
# ai_resume_analyzer.py — AI Resume Scoring & Analysis
#
# Computes a holistic resume_score (0–100) based on:
#   - Skill breadth & modern skills
#   - Project count & quality
#   - Resume text completeness
#   - Key section presence
#   - Experience signals
#
# Also generates:
#   - improvement_suggestions (actionable)
#   - strength_areas (positive highlights)
#   - missing_sections (what's absent)
# ============================================================

import re
from typing import List, Dict, Any

from database import supabase


# ── Modern/High-Value Skills Bonus List ─────────────────────
MODERN_SKILLS = {
    "machine learning", "deep learning", "nlp", "computer vision",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "system design", "microservices", "graphql", "redis",
    "tensorflow", "pytorch", "fastapi", "react", "typescript",
    "data science", "cloud", "devops", "ci/cd", "terraform",
}

# Resume sections to detect
EXPECTED_SECTIONS = {
    "education":    r'\b(education|academic|university|college|degree|b\.?tech|b\.?e)\b',
    "experience":   r'\b(experience|internship|work|employment|job|position)\b',
    "projects":     r'\b(projects?|personal projects?|academic projects?|work done)\b',
    "skills":       r'\b(skills?|technical skills?|competencies|technologies)\b',
    "contact":      r'\b(contact|email|phone|mobile|linkedin|github)\b',
    "achievements": r'\b(achievements?|awards?|honors?|certifications?|accomplishments?)\b',
}


def _detect_sections(text: str) -> Dict[str, bool]:
    """Detect which standard sections exist in the resume."""
    text_lower = text.lower()
    return {
        section: bool(re.search(pattern, text_lower, re.IGNORECASE))
        for section, pattern in EXPECTED_SECTIONS.items()
    }


def _count_quantified_achievements(text: str) -> int:
    """Count lines containing numbers that suggest quantified impact."""
    pattern = r'\b\d+[\+\%]?\s*(users?|projects?|students?|clients?|%|percent|times?|x\b|hours?|days?|months?|members?|lines?)'
    return len(re.findall(pattern, text, re.IGNORECASE))


def _detect_experience_years(text: str) -> float:
    """Try to extract years / months of experience (rough heuristic)."""
    matches = re.findall(r'(\d+)\+?\s*(years?|months?)', text, re.IGNORECASE)
    total_months = 0
    for amount, unit in matches:
        amount = int(amount)
        if 'month' in unit.lower():
            total_months += amount
        else:
            total_months += amount * 12
    return round(total_months / 12, 1)


def compute_resume_score(
    extracted_skills: List[str],
    extracted_projects: List[Dict],
    resume_text: str,
) -> Dict[str, Any]:
    """
    Compute a detailed resume score (0–100).

    Scoring breakdown:
      - Skill score       (30 pts): breadth + modern tech bonus
      - Project score     (25 pts): count + description depth
      - Section score     (20 pts): completeness of standard sections
      - Completeness      (15 pts): text length, quantified achievements
      - Experience bonus  (10 pts): internship/experience signals

    Returns a dict with score, component scores, suggestions, etc.
    """
    text_lower = resume_text.lower()
    sections = _detect_sections(resume_text)
    skills_lower = {s.lower() for s in extracted_skills}

    # ── 1. Skill Score (30 points) ──────────────────────────
    skill_count = len(extracted_skills)
    # Scale: 0 skills=0, 5=10, 10=20, 15+=30
    raw_skill_pts = min(skill_count / 15, 1.0) * 22

    # Modern skills bonus (up to 8 pts)
    modern_count = len(skills_lower & MODERN_SKILLS)
    modern_bonus = min(modern_count / 3, 1.0) * 8

    skill_score = round(raw_skill_pts + modern_bonus, 1)

    # ── 2. Project Score (25 points) ────────────────────────
    project_count = len(extracted_projects)
    # Base: up to 15 pts for 3+ projects
    project_pts = min(project_count / 3, 1.0) * 15

    # Description depth bonus (up to 10 pts)
    avg_desc_len = (
        sum(len(p.get("desc", "")) for p in extracted_projects) / max(project_count, 1)
    )
    depth_bonus = min(avg_desc_len / 200, 1.0) * 10

    project_score = round(project_pts + depth_bonus, 1)

    # ── 3. Section Score (20 points) ────────────────────────
    present_sections = sum(1 for v in sections.values() if v)
    section_score = round((present_sections / len(sections)) * 20, 1)

    # ── 4. Completeness Score (15 points) ───────────────────
    word_count = len(resume_text.split())
    # Ideal: 300–700 words
    if word_count < 100:
        completeness_pts = 2
    elif word_count < 300:
        completeness_pts = 7
    elif word_count <= 700:
        completeness_pts = 12
    else:
        completeness_pts = 10  # too long

    quant_count = _count_quantified_achievements(resume_text)
    quant_bonus = min(quant_count / 3, 1.0) * 3

    completeness_score = round(min(completeness_pts + quant_bonus, 15), 1)

    # ── 5. Experience Bonus (10 points) ─────────────────────
    has_experience = sections.get("experience", False)
    exp_years = _detect_experience_years(resume_text)
    exp_keywords = bool(re.search(
        r'\b(intern|internship|trainee|apprentice|worked at|employed)\b',
        text_lower
    ))

    if has_experience and (exp_years > 0 or exp_keywords):
        experience_score = min(exp_years * 3 + 5, 10)
    elif has_experience:
        experience_score = 5
    else:
        experience_score = 0
    experience_score = round(experience_score, 1)

    # ── Total Score ──────────────────────────────────────────
    total = round(skill_score + project_score + section_score + completeness_score + experience_score, 1)
    total = min(total, 100)

    # ── Generate Suggestions ────────────────────────────────
    suggestions = []
    strengths = []
    missing_sections = [s for s, present in sections.items() if not present]

    # Skill-based
    if skill_count < 8:
        suggestions.append("Add more technical skills (aim for at least 10–12 relevant skills).")
    elif skill_count >= 12:
        strengths.append(f"Strong skill set: {skill_count} skills detected.")

    if modern_count == 0:
        suggestions.append("Consider adding modern technologies like Docker, AWS, React, or ML frameworks.")
    elif modern_count >= 3:
        strengths.append(f"Good modern tech stack ({modern_count} cutting-edge skills).")

    # Project-based
    if project_count < 2:
        suggestions.append("Add at least 2–3 projects to showcase practical experience.")
    elif project_count >= 3:
        strengths.append(f"{project_count} projects listed — demonstrates hands-on experience.")

    if avg_desc_len < 50 and project_count > 0:
        suggestions.append("Expand project descriptions — include technologies used and measurable outcomes.")

    # Section-based
    if missing_sections:
        suggestions.append(
            f"Missing sections detected: {', '.join(missing_sections).title()}. "
            "Add them to make your resume more complete."
        )

    if not sections.get("achievements"):
        suggestions.append("Add an Achievements or Certifications section to stand out.")

    # Quantification
    if quant_count == 0 and word_count > 100:
        suggestions.append(
            "Use numbers to quantify your impact "
            "(e.g., 'Improved performance by 30%', 'Led a team of 5 members')."
        )
    elif quant_count >= 2:
        strengths.append("Good use of quantified achievements.")

    # Experience
    if not has_experience:
        suggestions.append(
            "Add internship or work experience. Even short-term projects or freelance work counts."
        )

    # Length
    if word_count < 150:
        suggestions.append("Your resume seems very short. Add more detail to projects and experiences.")
    elif word_count > 800:
        suggestions.append("Resume is quite long — keep it to 1 page (300–600 words) for fresher roles.")

    # Determine quality label
    if total >= 80:
        quality = "Excellent"
    elif total >= 65:
        quality = "Good"
    elif total >= 45:
        quality = "Average"
    else:
        quality = "Needs Work"

    return {
        "resume_score": total,
        "quality": quality,
        "component_scores": {
            "skills":       skill_score,
            "projects":     project_score,
            "sections":     section_score,
            "completeness": completeness_score,
            "experience":   experience_score,
        },
        "sections_detected": sections,
        "missing_sections":  missing_sections,
        "strength_areas":    strengths,
        "improvement_suggestions": suggestions,
        "stats": {
            "skill_count":    skill_count,
            "modern_skills":  modern_count,
            "project_count":  project_count,
            "word_count":     word_count,
            "quant_achievements": quant_count,
            "experience_years": exp_years,
        },
    }


def analyze_resume_by_id(resume_id: int) -> Dict[str, Any]:
    """
    Load resume data from DB, compute score, persist back, return analysis.
    """
    # Fetch resume record
    resp = (
        supabase.table("resume_metadata")
        .select("*")
        .eq("id", resume_id)
        .single()
        .execute()
    )

    if not resp.data:
        return {"error": "Resume not found"}

    record = resp.data
    extracted_skills   = record.get("extracted_skills", []) or []
    extracted_projects = record.get("extracted_projects", []) or []

    # We don't store raw text — re-use skill/project data for scoring
    # Build a proxy text for section detection from what we have
    proxy_text = " ".join(extracted_skills) + " "
    for p in extracted_projects:
        proxy_text += p.get("name", "") + " " + p.get("desc", "") + " "

    # Enrich proxy text with label if available
    proxy_text += " " + (record.get("label", "") or "")

    analysis = compute_resume_score(extracted_skills, extracted_projects, proxy_text)

    # Persist score back to DB
    supabase.table("resume_metadata").update({
        "resume_score": analysis["resume_score"],
        "analysis_data": analysis,
    }).eq("id", resume_id).execute()

    return {
        "resume_id": resume_id,
        **analysis,
    }
