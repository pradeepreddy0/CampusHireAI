# ============================================================
# excel_export.py — Export Shortlisted Students as Excel
#
# Creates an Excel (.xlsx) file using pandas with all
# shortlisted students for a given drive.
# ============================================================

import io
from typing import Optional

import pandas as pd

from database import supabase


def generate_shortlisted_excel(drive_id: int) -> Optional[bytes]:
    """
    Generate an Excel file containing all shortlisted students
    for a specific drive.

    Args:
        drive_id: ID of the placement drive

    Returns:
        bytes of the Excel file, or None if no data found
    """
    # --- Fetch drive info ---
    drive_resp = (
        supabase.table("drives")
        .select("company_name, role")
        .eq("id", drive_id)
        .single()
        .execute()
    )
    drive = drive_resp.data

    if not drive:
        return None

    # --- Fetch shortlisted applications ---
    apps_resp = (
        supabase.table("applications")
        .select("student_id, ai_score, applied_at, status")
        .eq("drive_id", drive_id)
        .eq("status", "Shortlisted")
        .execute()
    )
    applications = apps_resp.data or []

    if not applications:
        return None

    # --- Enrich with student details ---
    rows = []
    for app in applications:
        student_resp = (
            supabase.table("users")
            .select("roll_no, name, email, branch, cgpa")
            .eq("id", app["student_id"])
            .single()
            .execute()
        )
        student = student_resp.data

        if not student:
            continue

        # Fetch resume skills
        resume_resp = (
            supabase.table("resume_metadata")
            .select("extracted_skills")
            .eq("student_id", app["student_id"])
            .single()
            .execute()
        )
        resume = resume_resp.data
        skills = resume.get("extracted_skills", []) if resume else []

        rows.append({
            "Roll No": student.get("roll_no"),
            "Name": student.get("name"),
            "Email": student.get("email"),
            "Branch": student.get("branch"),
            "CGPA": student.get("cgpa"),
            "AI Score": app.get("ai_score"),
            "Skills": ", ".join(skills),
            "Applied At": app.get("applied_at"),
            "Status": app.get("status"),
        })

    # --- Create Excel file in memory ---
    df = pd.DataFrame(rows)

    # Format the sheet nicely
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        sheet_name = f"{drive['company_name'][:25]} - Shortlisted"
        df.to_excel(writer, index=False, sheet_name=sheet_name)

        # Auto-adjust column widths
        worksheet = writer.sheets[sheet_name]
        for i, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(col)
            ) + 2
            worksheet.column_dimensions[chr(65 + i)].width = min(max_length, 40)

    output.seek(0)
    return output.getvalue()
