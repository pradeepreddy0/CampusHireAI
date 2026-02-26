# ============================================================
# email_service.py — SMTP Email Notifications
#
# Sends shortlist notification emails to students.
# Uses Python's built-in smtplib — no external email service.
# ============================================================

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()

# ── SMTP Configuration ──────────────────────────────────────

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def send_shortlist_email(to_email: str, student_name: str, company_name: str) -> bool:
    """
    Send a shortlist notification email to a student.

    Args:
        to_email:     Student's email address
        student_name: Student's name (for personalization)
        company_name: Name of the company that shortlisted them

    Returns:
        True if the email was sent successfully, False otherwise.
    """
    # Validate SMTP credentials are configured
    if not SMTP_USER or not SMTP_PASS:
        print("⚠️  SMTP credentials not configured. Skipping email.")
        return False

    # --- Build the email ---
    subject = f"🎉 Congratulations! You've been shortlisted by {company_name}"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">CampusHireAI — Shortlist Notification</h2>
        <p>Dear <strong>{student_name}</strong>,</p>
        <p>
            We are pleased to inform you that you have been
            <strong style="color: #16a34a;">shortlisted</strong>
            by <strong>{company_name}</strong> through the CampusHireAI platform.
        </p>
        <p>
            Please check your dashboard for next steps and further instructions.
        </p>
        <br>
        <p>Best regards,<br>CampusHireAI Team</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
            This is an automated message. Do not reply to this email.
        </p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    # --- Send the email ---
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()                           # Upgrade to secure connection
            server.login(SMTP_USER, SMTP_PASS)          # Authenticate
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False


def send_selection_email(
    to_email: str,
    student_name: str,
    company_name: str,
    package: float = 0.0,
) -> bool:
    """
    Send a placement confirmation email to a student.

    Args:
        to_email:     Student's email address
        student_name: Student's name
        company_name: Company that selected them
        package:      CTC / LPA offered

    Returns:
        True if sent successfully, False otherwise.
    """
    if not SMTP_USER or not SMTP_PASS:
        print("⚠️  SMTP credentials not configured. Skipping email.")
        return False

    subject = f"🎉 Congratulations! You've been placed at {company_name}"

    package_line = (
        f"with a package of <strong>{package} LPA</strong>"
        if package
        else ""
    )

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #16a34a;">CampusHireAI — Placement Confirmation</h2>
        <p>Dear <strong>{student_name}</strong>,</p>
        <p>
            We are thrilled to inform you that you have been
            <strong style="color: #16a34a;">selected / placed</strong>
            at <strong>{company_name}</strong> {package_line}
            through the CampusHireAI platform.
        </p>
        <p>
            Please check your dashboard for offer details and next steps.
        </p>
        <br>
        <p>Best regards,<br>CampusHireAI Team</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
            This is an automated message. Do not reply to this email.
        </p>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"✅ Selection email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send selection email to {to_email}: {e}")
        return False
