\
Meta-Pet Registration Scroll (Demo)
==================================

What this is
------------
A small Flask app that implements a clean "Pet registration papers" flow:

- Email link (private; not printed)
- Public handle (optional)
- Pet name (required)
- Avatar upload (optional; stored)
- Memory seed phrase (optional)
- Generates a PDF "Registration Scroll" with a seal + proof-of-link hash

Run locally
----------
1) Create venv (optional)
2) Install deps:
   pip install -r requirements.txt

3) Start:
   python app.py

4) Visit:
   http://127.0.0.1:5050

Notes
-----
- This demo stores data in data/registrations.jsonl (append-only).
- PDFs are stored in data/scrolls/.
- Avatars are stored in data/uploads/ (not embedded in PDF in this lightweight version).
- In production: store emails encrypted, add auth (magic link), add rate limiting, and use a proper database.
