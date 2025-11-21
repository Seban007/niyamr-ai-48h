# backend/main.py
import os
import io
import re
import json
from typing import List
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Keep OpenAI import optional (we're using heuristics for demo)
try:
    import openai
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

app = FastAPI(title="NIYAMR PDF Rule Checker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RuleResult(BaseModel):
    rule: str
    status: str  # pass/fail
    evidence: str
    reasoning: str
    confidence: int

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF bytes using pdfplumber. Returns a string with page markers.
    """
    try:
        import pdfplumber
        pages = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                pages.append(f"--- PAGE {i+1} ---\n{text}")
        return "\n\n".join(pages)
    except Exception as e:
        # If extraction fails (e.g., pdfplumber not installed or PDF is scanned), return empty string
        print("PDF extraction error:", str(e))
        return ""

def call_openai(document_text: str, rule: str) -> dict:
    """
    Heuristic-only fallback for demo purposes (no LLM).
    It returns pass/fail + short evidence + reasoning + confidence.
    """
    rule_low = (rule or "").lower()
    evidence = ""
    status = "fail"
    confidence = 30
    dt = document_text or ""

    # DATE check
    if "date" in rule_low or "day" in rule_low or "year" in rule_low or "month" in rule_low:
        m = re.search(
            r"\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b",
            dt,
            re.I,
        )
        if m:
            status = "pass"
            evidence = f"Found date-like text: '{m.group(0)}'"
            confidence = 88
        else:
            status = "fail"
            evidence = "No date-like text found in document."
            confidence = 26

    # PURPOSE / OBJECTIVE check (heading-like)
    elif "purpose" in rule_low or "objective" in rule_low or "scope" in rule_low or "aim" in rule_low:
        m = re.search(r"(?mi)^\s*(purpose|objective|scope|aim)\s*[:\-]?\s*(.*)$", dt)
        if m:
            status = "pass"
            evidence = f"Found heading: '{m.group(0).strip()}'"
            confidence = 85
        else:
            # fallback: keyword anywhere
            if re.search(r"(?i)\bpurpose\b|\bobjective\b|\bscope\b", dt):
                status = "pass"
                evidence = "Found 'purpose' or 'objective' keyword in document."
                confidence = 70
            else:
                evidence = "No Purpose/Objective heading or keyword found."
                confidence = 28

    # RESPONSIBLE / OWNER check
    elif "respons" in rule_low or "owner" in rule_low or "accountable" in rule_low:
        m = re.search(r"(?mi)(responsible|owner|accountable)[\s:\-]+(.{1,120})", dt)
        if m:
            status = "pass"
            evidence = f"Found responsibility phrase: '{m.group(0).strip()}'"
            confidence = 86
        else:
            if re.search(r"(?i)\bresponsible\b|\bowner\b|\baccountable\b", dt):
                status = "pass"
                evidence = "Found responsibility-related keywords."
                confidence = 70
            else:
                evidence = "No responsibility-related keywords found."
                confidence = 30

    else:
        # Generic fallback: check if first keyword of rule appears
        words = rule_low.split()
        first_word = words[0] if words else ""
        if first_word and re.search(re.escape(first_word), dt, re.I):
            status = "pass"
            evidence = f"Found keyword '{first_word}' in document."
            confidence = 60
        else:
            status = "fail"
            evidence = "Heuristic not decisive for this rule."
            confidence = 30

    return {
        "rule": rule,
        "status": status,
        "evidence": evidence,
        "reasoning": "Heuristic-based check (no LLM).",
        "confidence": int(confidence),
    }

@app.post("/check")
async def check_pdf(
    file: UploadFile = File(...),
    rule1: str = Form(None),
    rule2: str = Form(None),
    rule3: str = Form(None)
):
    """
    Endpoint accepts a PDF and up to three rules (form-data).
    Returns a JSON list of results (rule, status, evidence, reasoning, confidence).
    """
    # Read uploaded file bytes
    content = await file.read()
    # Extract text
    doc_text = extract_text_from_pdf_bytes(content)
    # Collect non-empty rules
    rules = [r for r in (rule1, rule2, rule3) if r and r.strip()]

    results = []
    for r in rules:
        res = call_openai(doc_text, r)
        # Ensure keys exist and types are sane
        results.append({
            "rule": res.get("rule", r),
            "status": res.get("status", "fail"),
            "evidence": res.get("evidence", ""),
            "reasoning": res.get("reasoning", ""),
            "confidence": int(res.get("confidence", 0) or 0)
        })

    return {"results": results}
