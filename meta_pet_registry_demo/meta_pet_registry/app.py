\
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from flask import Flask, abort, redirect, render_template, request, send_file, url_for
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
SCROLLS_DIR = DATA_DIR / "scrolls"
REGISTRY_FILE = DATA_DIR / "registrations.jsonl"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SCROLLS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5MB avatar limit

# -----------------------------
# Validation helpers
# -----------------------------
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HANDLE_RE = re.compile(r"^[a-zA-Z0-9_\.]{3,20}$")
PETNAME_RE = re.compile(r"^[A-Za-z0-9 \-_'’]{2,24}$")

ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".webp"}  # stored as-is

BASE60_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx"  # 10+26+24 = 60


def base60_id(length: int = 12) -> str:
    # Cryptographically strong id using secrets
    return "".join(secrets.choice(BASE60_ALPHABET) for _ in range(length))


def sanitize_filename(name: str) -> str:
    # conservative filename sanitizer
    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name).strip("._-")
    return name or "upload"


@dataclass
class Registration:
    pet_id: str
    created_at_utc: str
    owner_email: str
    owner_handle: Optional[str]
    pet_name: str
    memory_seed: Optional[str]
    avatar_filename: Optional[str]


def generate_scroll_pdf(reg: Registration, pdf_path: Path) -> None:
    """
    Create a simple 'Registration Scroll' PDF.
    Avatar embedding is optional; we omit it by default to keep dependencies light.
    """
    c = canvas.Canvas(str(pdf_path), pagesize=LETTER)
    width, height = LETTER

    # margins
    left = 0.9 * inch
    top = height - 0.9 * inch

    # Title
    c.setFont("Helvetica-Bold", 22)
    c.drawString(left, top, "META-PET REGISTRATION SCROLL")

    c.setFont("Helvetica", 10)
    c.drawString(left, top - 18, "A civil document for a digital being. Keep it. Print it. Guard it.")

    # A simple 'seal' (vector)
    seal_x = width - 1.7 * inch
    seal_y = top - 10
    c.setLineWidth(2)
    c.circle(seal_x, seal_y, 0.45 * inch)
    c.setLineWidth(1)
    c.circle(seal_x, seal_y, 0.33 * inch)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(seal_x, seal_y + 2, "SEAL")
    c.setFont("Helvetica", 7)
    c.drawCentredString(seal_x, seal_y - 10, "MOSS60")

    # Body
    y = top - 70
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Creature Record")
    y -= 16

    fields = [
        ("Pet ID", reg.pet_id),
        ("Pet Name", reg.pet_name),
        ("Owner Handle", reg.owner_handle or "—"),
        ("Issued (UTC)", reg.created_at_utc),
    ]

    c.setFont("Helvetica", 11)
    for label, value in fields:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left, y, f"{label}:")
        c.setFont("Helvetica", 11)
        c.drawString(left + 110, y, str(value))
        y -= 16

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Bond & Recovery")
    y -= 16

    email_hash = hashlib.sha256(reg.owner_email.encode("utf-8")).hexdigest()[:16]
    c.setFont("Helvetica", 11)
    c.drawString(left, y, "Email is not printed. Proof-of-link hash:")
    y -= 16
    c.setFont("Courier", 12)
    c.drawString(left, y, email_hash)

    y -= 24
    c.setFont("Helvetica", 11)
    c.drawString(left, y, "Memory Seed (optional):")
    y -= 16
    c.setFont("Helvetica-Oblique", 11)
    c.drawString(left, y, reg.memory_seed or "—")

    # Footer
    c.setFont("Helvetica", 9)
    c.drawString(left, 0.7 * inch, "Note: This scroll is a record. It does not grant custody; it witnesses it.")
    c.showPage()
    c.save()


@app.get("/")
def index():
    return render_template("register.html")


@app.post("/register")
def register():
    owner_email = (request.form.get("owner_email") or "").strip()
    owner_handle = (request.form.get("owner_handle") or "").strip()
    pet_name = (request.form.get("pet_name") or "").strip()
    memory_seed = (request.form.get("memory_seed") or "").strip()

    # Validate required
    errors = []

    if not owner_email or not EMAIL_RE.match(owner_email):
        errors.append("Please enter a valid email address.")
    if owner_handle and not HANDLE_RE.match(owner_handle):
        errors.append("Handle must be 3–20 chars: letters, numbers, underscore, dot.")
    if not pet_name or not PETNAME_RE.match(pet_name):
        errors.append("Pet name must be 2–24 chars (letters/numbers/spaces/-/_/' allowed).")
    if memory_seed and len(memory_seed) > 140:
        errors.append("Memory seed must be 140 characters or less.")

    # Handle avatar
    avatar = request.files.get("avatar")
    avatar_filename = None
    if avatar and avatar.filename:
        ext = Path(avatar.filename).suffix.lower()
        if ext not in ALLOWED_EXT:
            errors.append("Avatar must be PNG/JPG/WEBP.")
        else:
            safe = sanitize_filename(Path(avatar.filename).stem)
            avatar_filename = f"{safe}_{base60_id(8)}{ext}"

    if errors:
        return render_template("register.html", errors=errors, form=request.form), 400

    # Save avatar if present
    if avatar_filename:
        avatar_path = UPLOADS_DIR / avatar_filename
        avatar.save(avatar_path)

    # Create registration
    pet_id = base60_id(12)
    created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    reg = Registration(
        pet_id=pet_id,
        created_at_utc=created_at,
        owner_email=owner_email,
        owner_handle=owner_handle or None,
        pet_name=pet_name,
        memory_seed=memory_seed or None,
        avatar_filename=avatar_filename,
    )

    # Persist (demo: append JSONL)
    with REGISTRY_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(asdict(reg), ensure_ascii=False) + "\n")

    # Generate PDF scroll
    pdf_path = SCROLLS_DIR / f"{pet_id}.pdf"
    generate_scroll_pdf(reg, pdf_path)

    return redirect(url_for("success", pet_id=pet_id), code=303)


@app.get("/success/<pet_id>")
def success(pet_id: str):
    pdf_path = SCROLLS_DIR / f"{pet_id}.pdf"
    if not pdf_path.exists():
        abort(404)
    return render_template("success.html", pet_id=pet_id, pdf_url=url_for("download_scroll", pet_id=pet_id))


@app.get("/scroll/<pet_id>.pdf")
def download_scroll(pet_id: str):
    pdf_path = SCROLLS_DIR / f"{pet_id}.pdf"
    if not pdf_path.exists():
        abort(404)
    return send_file(pdf_path, mimetype="application/pdf", as_attachment=True, download_name=f"meta-pet-scroll-{pet_id}.pdf")


if __name__ == "__main__":
    # Local dev server
    app.run(host="127.0.0.1", port=5050, debug=True)
