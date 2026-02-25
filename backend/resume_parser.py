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


def extract_projects(text: str) -> List[Dict]:
    """
    Simple project extraction — looks for common section headers
    like "Projects", "Academic Projects", etc. and captures the
    lines underneath as project entries.

    Returns a list of dicts: [{"name": "...", "description": "..."}]
    """
    projects = []
    lines = text.split("\n")
    in_projects_section = False

    for line in lines:
        stripped = line.strip()
        # Detect project section headers
        if re.match(r'^(projects|academic projects|personal projects)', stripped, re.IGNORECASE):
            in_projects_section = True
            continue

        # Stop when we hit the next section header
        if in_projects_section and re.match(r'^(education|experience|skills|certifications|achievements)', stripped, re.IGNORECASE):
            break

        # Capture non-empty lines as project entries
        if in_projects_section and stripped:
            projects.append({
                "name": stripped[:80],         # First 80 chars as name
                "description": stripped,
            })

    return projects


async def upload_and_parse_resume(file_bytes: bytes, filename: str, student_id: str) -> dict:
    """
    Full resume processing pipeline:
      1. Upload PDF to Supabase Storage
      2. Extract text with pdfplumber
      3. Extract skills and projects
      4. Upsert data into resume_metadata table
      5. Return extracted data

    Args:
        file_bytes: Raw PDF file content
        filename:   Original filename (e.g. "resume.pdf")
        student_id: UUID of the student

    Returns:
        dict with resume_url, extracted_skills, extracted_projects
    """
    # --- 1. Upload to Supabase Storage ---
    storage_path = f"resumes/{student_id}/{filename}"

    # Upload file (overwrite if exists)
    supabase.storage.from_("resumes").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )

    # Get public URL for the uploaded file
    resume_url = supabase.storage.from_("resumes").get_public_url(storage_path)

    # --- 2. Extract text ---
    text = extract_text_from_pdf(file_bytes)

    # --- 3. Extract skills and projects ---
    skills = extract_skills(text)
    projects = extract_projects(text)

    # --- 4. Upsert into resume_metadata ---
    supabase.table("resume_metadata").upsert({
        "student_id": student_id,
        "resume_url": resume_url,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }).execute()

    # --- 5. Return extracted data ---
    return {
        "resume_url": resume_url,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }
