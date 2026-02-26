# ============================================================
# resume_parser.py — Resume Upload & Skill Extraction
#
# Flow:
#   1. Receive PDF file from student
#   2. Upload to Supabase Storage (bucket: "resumes")
#   3. Extract text from PDF using pdfplumber
#   4. Extract skills using spaCy + predefined skill list
#   5. Store extracted data in resume_metadata table
# ============================================================

import io
import re
from typing import List, Dict

import pdfplumber
import spacy

from database import supabase

# ── Load spaCy model ────────────────────────────────────────
# Using the small English model for lightweight skill extraction.
# Install with:  python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("⚠️  spaCy model 'en_core_web_sm' not found. Run:")
    print("   python -m spacy download en_core_web_sm")
    nlp = None

# ── Predefined Skill List ───────────────────────────────────
# These keywords are matched against the resume text (case-insensitive).
# Add or remove skills as needed for your university context.
SKILL_LIST = [
    "python", "java", "javascript", "typescript", "c++", "c#", "c",
    "react", "angular", "vue", "node.js", "express", "fastapi", "django",
    "flask", "spring boot", "html", "css", "tailwind",
    "sql", "postgresql", "mysql", "mongodb", "redis", "firebase",
    "supabase", "aws", "azure", "gcp", "docker", "kubernetes",
    "git", "github", "linux", "rest api", "graphql",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "data analysis", "data science", "power bi", "tableau",
    "figma", "ui/ux", "agile", "scrum", "jira",
    "communication", "teamwork", "leadership", "problem solving",
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from a PDF file using pdfplumber.
    Returns the concatenated text from every page.
    """
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_skills(text: str) -> List[str]:
    """
    Extract skills from resume text by:
      1. Keyword matching against SKILL_LIST
      2. (Optional) spaCy entity recognition for additional context

    Returns a deduplicated list of matched skill names.
    """
    text_lower = text.lower()
    found_skills = []

    # --- Step 1: Keyword matching ---
    for skill in SKILL_LIST:
        # Use word-boundary regex so "c" doesn't match inside "react"
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title())  # Capitalize for display

    # --- Step 2: spaCy NER (optional enhancement) ---
    if nlp:
        doc = nlp(text)
        for ent in doc.ents:
            # Look for ORG/PRODUCT entities that might be tech names
            if ent.label_ in ("ORG", "PRODUCT"):
                skill_name = ent.text.strip()
                if skill_name.lower() in [s.lower() for s in SKILL_LIST]:
                    title_name = skill_name.title()
                    if title_name not in found_skills:
                        found_skills.append(title_name)

    return found_skills


def _is_description_line(line: str) -> bool:
    """
    Decide whether a line is a description/bullet point (True)
    or a project title (False).

    Description lines typically:
      - Start with bullet characters (•, -, *, etc.)
      - Start with common action/past-tense verbs
      - Are long sentences (> 60 chars without separators like | or –)
      - Start with lowercase letters
    """
    stripped = line.strip()
    if not stripped:
        return True

    # 1. Bullet / symbol prefix => always a description
    if re.match(r'^[•\-\*◦▪○●→▸►✓✔☑]\s*', stripped):
        return True

    # 2. Starts with a lowercase letter => description continuation
    if stripped[0].islower():
        return True

    # 3. Starts with common action verbs used in project descriptions
    action_verbs = (
        "Developed", "Built", "Created", "Implemented", "Designed",
        "Integrated", "Used", "Utilized", "Deployed", "Configured",
        "Managed", "Led", "Worked", "Collaborated", "Improved",
        "Optimized", "Reduced", "Increased", "Achieved", "Established",
        "Wrote", "Tested", "Debugged", "Resolved", "Fixed",
        "Added", "Updated", "Maintained", "Migrated", "Refactored",
        "Automated", "Analyzed", "Researched", "Conducted", "Performed",
        "Ensured", "Enhanced", "Enabled", "Generated", "Processed",
        "Transformed", "Applied", "Leveraged", "Incorporated",
        "Responsible", "Assisted", "Supported", "Contributed",
        "Constructed", "Programmed", "Engineered", "Architected",
        "Streamlined", "Spearheaded", "Initiated", "Orchestrated",
        "Secured", "Handled", "Executed", "Delivered", "Published",
        "Presented", "Trained", "Mentored", "Supervised",
        "The", "This", "It ", "A ", "An ",
    )
    for verb in action_verbs:
        if stripped.startswith(verb):
            return True

    # 4. Long lines without title-separators are likely descriptions
    has_separator = bool(re.search(r'[|–—:]', stripped))
    if len(stripped) > 80 and not has_separator:
        return True

    return False


def extract_projects(text: str) -> List[Dict]:
    """
    Project extraction that uses title detection heuristics.

    A line is a PROJECT TITLE if it:
      - Does NOT start with action verbs (Developed, Built, etc.)
      - Does NOT start with bullet characters
      - Is relatively short or contains separators (|, –, :)
      - Starts with an uppercase letter

    Everything else gets appended as description to the current project.

    Returns a list of dicts: [{"name": "...", "desc": "..."}]
    """
    projects = []
    lines = text.split("\n")
    in_projects_section = False
    current_project = None

    section_header_re = re.compile(
        r'^(education|experience|work experience|skills|technical skills'
        r'|certifications|achievements|awards|hobbies|interests'
        r'|references|publications|summary|objective|contact'
        r'|extra.?curricular|co.?curricular|activities)',
        re.IGNORECASE,
    )
    project_section_re = re.compile(
        r'^(projects|academic projects|personal projects|major projects'
        r'|mini projects|key projects|selected projects)',
        re.IGNORECASE,
    )
    bullet_clean_re = re.compile(r'^[•\-\*◦▪○●→▸►✓✔☑]\s*')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Detect project section start
        if project_section_re.match(stripped):
            in_projects_section = True
            continue

        if not in_projects_section:
            continue

        # Stop when we hit the next section
        if section_header_re.match(stripped):
            break

        if _is_description_line(line):
            # This is a description / bullet — attach to current project
            clean = bullet_clean_re.sub('', stripped).strip()
            if current_project and clean:
                if current_project["desc"]:
                    current_project["desc"] += " • " + clean
                else:
                    current_project["desc"] = clean
        else:
            # This looks like a project TITLE
            if current_project:
                projects.append(current_project)

            current_project = {
                "name": stripped[:150],
                "desc": "",
            }

    # Don't forget the last project
    if current_project:
        projects.append(current_project)

    return projects


async def upload_and_parse_resume(file_bytes: bytes, filename: str, student_id: str, label: str = "Resume") -> dict:
    """
    Full resume processing pipeline:
      1. Upload PDF to Supabase Storage
      2. Extract text with pdfplumber
      3. Extract skills and projects
      4. Insert data into resume_metadata table (supports multiple resumes)
      5. Return extracted data with resume_id
    """
    # --- 1. Upload to Supabase Storage ---
    import time
    ts = int(time.time())
    storage_path = f"resumes/{student_id}/{ts}_{filename}"

    supabase.storage.from_("resumes").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )

    resume_url = supabase.storage.from_("resumes").get_public_url(storage_path)

    # --- 2. Extract text ---
    text = extract_text_from_pdf(file_bytes)

    # --- 3. Extract skills and projects ---
    skills = extract_skills(text)
    projects = extract_projects(text)

    # --- 4. Insert into resume_metadata (multiple resumes allowed) ---
    resp = supabase.table("resume_metadata").insert({
        "student_id": student_id,
        "label": label,
        "resume_url": resume_url,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }).execute()

    resume_id = resp.data[0]["id"] if resp.data else None

    # --- 5. Return extracted data ---
    return {
        "resume_id": resume_id,
        "label": label,
        "resume_url": resume_url,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }

