# ============================================================
# database.py — Supabase Client Initialization
# Creates a single Supabase client instance used by all modules.
# ============================================================

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Read Supabase credentials from environment
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# Validate that credentials are set
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing SUPABASE_URL or SUPABASE_KEY in .env file. "
        "Please set these values before starting the server."
    )

# Create the Supabase client — this is imported by other modules
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
