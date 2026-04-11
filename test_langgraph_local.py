"""
Local test script for LangGraph LLM email generation.

Usage:
    python test_langgraph_local.py              # Run all tests
    python test_langgraph_local.py --live        # Include live Gemini API test (requires valid key)
"""

import os
import sys
import time
import argparse

# Force UTF-8 output on Windows to avoid cp1252 encoding issues
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

load_dotenv()

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Test data ────────────────────────────────────────────────────────────────

SAMPLE_RECRUITER = {
    "recruiter_name": "Sarah Chen",
    "recruiter_email": "sarah.chen@techcorp.com",
    "company": "TechCorp AI",
    "role": "ML Engineer",
    "company_type": "AI/ML startup building autonomous agents",
    "notes": "Series B, hiring aggressively for their core platform team",
}

SAMPLE_PROFILE = {
    "full_name": "Alex Johnson",
    "phone": "+1-555-0199",
    "linkedin": "https://linkedin.com/in/alexjohnson",
    "github": "https://github.com/alexjohnson",
    "portfolio": "https://alexjohnson.dev",
    "degree": "B.S. Computer Science",
    "university": "UC Berkeley",
    "graduation_date": "May 2025",
    "current_title": "ML Engineer Intern",
    "current_company": "DeepMind",
    "experience_summary": "Built distributed training pipelines processing 10TB+ daily",
    "key_skills": ["Python", "PyTorch", "LangChain", "Kubernetes", "MLOps"],
    "highlights": [
        "Reduced model training time by 40% via custom data pipeline",
        "Deployed 3 production ML models serving 1M+ requests/day",
        "Open-source contributor to LangChain (50+ GitHub stars)",
    ],
    "preferred_roles": ["ML Engineer", "AI Engineer", "Backend Engineer"],
    "email_sign_off": "Best regards",
}

MINIMAL_RECRUITER = {
    "recruiter_name": "John",
    "recruiter_email": "john@example.com",
    "company": "StartupXYZ",
}

MINIMAL_PROFILE = {
    "full_name": "Test User",
    "current_title": "Developer",
    "current_company": "SomeCo",
    "experience_summary": "3 years of full-stack development",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def header(text: str):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'━' * 60}")
    print(f"  {text}")
    print(f"{'━' * 60}{Colors.RESET}")


def passed(name: str, detail: str = ""):
    extra = f" {Colors.DIM}({detail}){Colors.RESET}" if detail else ""
    print(f"  {Colors.GREEN}✓ PASS{Colors.RESET}  {name}{extra}")


def failed(name: str, detail: str = ""):
    extra = f" {Colors.DIM}({detail}){Colors.RESET}" if detail else ""
    print(f"  {Colors.RED}✗ FAIL{Colors.RESET}  {name}{extra}")


def warning(text: str):
    print(f"  {Colors.YELLOW}⚠ {text}{Colors.RESET}")


def info(text: str):
    print(f"  {Colors.DIM}│ {text}{Colors.RESET}")


# ── Tests ────────────────────────────────────────────────────────────────────

def test_imports():
    """Verify all LangGraph modules import cleanly."""
    header("Test: Imports")
    results = []

    try:
        from src.langgraph_workflow import EmailState
        passed("EmailState TypedDict")
        results.append(True)
    except Exception as e:
        failed("EmailState TypedDict", str(e))
        results.append(False)

    try:
        from src.langgraph_workflow import build_email_graph
        passed("build_email_graph")
        results.append(True)
    except Exception as e:
        failed("build_email_graph", str(e))
        results.append(False)

    try:
        from src.langgraph_workflow import (
            validate_input, enrich_context, build_prompt,
            call_llm, parse_response, quality_check,
            apply_attachments, fallback_email,
        )
        passed("All node functions")
        results.append(True)
    except Exception as e:
        failed("All node functions", str(e))
        results.append(False)

    try:
        from src.langgraph_workflow import (
            route_after_validation, route_after_llm,
            route_after_parse, route_after_quality,
        )
        passed("All routing functions")
        results.append(True)
    except Exception as e:
        failed("All routing functions", str(e))
        results.append(False)

    try:
        from src.llm_generator import LLMEmailGenerator
        passed("LLMEmailGenerator class")
        results.append(True)
    except Exception as e:
        failed("LLMEmailGenerator class", str(e))
        results.append(False)

    return all(results)


def test_graph_compilation():
    """Verify the graph compiles without errors."""
    header("Test: Graph Compilation")
    from src.langgraph_workflow import build_email_graph

    try:
        graph = build_email_graph()
        passed("Graph compiled successfully")
        info(f"Graph type: {type(graph).__name__}")
        return True
    except Exception as e:
        failed("Graph compilation", str(e))
        return False


def test_individual_nodes():
    """Test each node function in isolation."""
    header("Test: Individual Node Functions")
    from src.langgraph_workflow import (
        validate_input, enrich_context, build_prompt,
        parse_response, quality_check, apply_attachments, fallback_email,
    )
    results = []

    # validate_input — valid input
    r = validate_input({"recruiter": SAMPLE_RECRUITER, "user_profile": SAMPLE_PROFILE})
    ok = r.get("error") is None
    (passed if ok else failed)("validate_input (valid)", f"error={r.get('error')}")
    results.append(ok)

    # validate_input — missing profile
    r = validate_input({"recruiter": SAMPLE_RECRUITER})
    ok = r.get("error") is not None and "user_profile" in r["error"]
    (passed if ok else failed)("validate_input (missing profile)", f"error={r.get('error')}")
    results.append(ok)

    # validate_input — bad recruiter type
    r = validate_input({"recruiter": "not-a-dict", "user_profile": SAMPLE_PROFILE})
    ok = r.get("error") is not None and "dict" in r["error"]
    (passed if ok else failed)("validate_input (bad recruiter)", f"error={r.get('error')}")
    results.append(ok)

    # enrich_context
    r = enrich_context({"recruiter": SAMPLE_RECRUITER})
    ok = r.get("first_name") == "Sarah" and r.get("company") == "TechCorp AI"
    (passed if ok else failed)("enrich_context", f"first_name={r.get('first_name')}, company={r.get('company')}")
    results.append(ok)

    # build_prompt
    state = {
        "recruiter": SAMPLE_RECRUITER,
        "user_profile": SAMPLE_PROFILE,
        "first_name": "Sarah",
        "company": "TechCorp AI",
        "company_type": "AI startup",
        "notes": "Hiring ML engineers",
    }
    r = build_prompt(state)
    ok = "prompt" in r and "Alex Johnson" in r["prompt"] and "TechCorp AI" in r["prompt"]
    (passed if ok else failed)("build_prompt", f"prompt length={len(r.get('prompt', ''))}")
    results.append(ok)

    # parse_response — valid LLM output
    r = parse_response({"llm_response": "Subject: Test Subject\n\nHi there,\n\nThis is the body."})
    ok = r.get("subject") == "Test Subject" and "body" in r.get("body", "")
    (passed if ok else failed)("parse_response (valid)", f"subject='{r.get('subject')}', body_len={len(r.get('body', ''))}")
    results.append(ok)

    # parse_response — no subject
    r = parse_response({"llm_response": "Just a body with no subject line"})
    ok = r.get("error") is not None and "no subject" in r["error"]
    (passed if ok else failed)("parse_response (no subject)", f"error={r.get('error')}")
    results.append(ok)

    # parse_response — markdown wrapped
    r = parse_response({"llm_response": "```\nSubject: Wrapped Subject\n\nBody here\n```"})
    ok = r.get("subject") == "Wrapped Subject"
    (passed if ok else failed)("parse_response (markdown)", f"subject='{r.get('subject')}'")
    results.append(ok)

    # quality_check — pass
    r = quality_check({"subject": "Good Subject", "body": "A" * 60})
    ok = r.get("error") is None
    (passed if ok else failed)("quality_check (pass)", f"error={r.get('error')}")
    results.append(ok)

    # quality_check — short body
    r = quality_check({"subject": "Good Subject", "body": "Too short"})
    ok = r.get("error") is not None and "too short" in r["error"]
    (passed if ok else failed)("quality_check (short body)", f"error={r.get('error')}")
    results.append(ok)

    # quality_check — empty subject
    r = quality_check({"subject": "", "body": "A" * 60})
    ok = r.get("error") is not None and "empty subject" in r["error"]
    (passed if ok else failed)("quality_check (empty subject)", f"error={r.get('error')}")
    results.append(ok)

    # apply_attachments — with flag
    r = apply_attachments({"has_attachments": True, "body": "Hello there."})
    ok = "attached my resume" in r.get("body", "")
    (passed if ok else failed)("apply_attachments (with)", f"contains attachment mention={ok}")
    results.append(ok)

    # apply_attachments — without flag
    r = apply_attachments({"has_attachments": False, "body": "Hello there."})
    ok = r == {}
    (passed if ok else failed)("apply_attachments (without)", f"no-op={ok}")
    results.append(ok)

    # fallback_email
    r = fallback_email({
        "recruiter": SAMPLE_RECRUITER,
        "user_profile": SAMPLE_PROFILE,
        "error": "test error",
    })
    ok = (
        r.get("used_fallback") is True
        and r.get("fallback_reason") == "test error"
        and r.get("subject")
        and r.get("body")
        and r.get("error") is None
    )
    (passed if ok else failed)(
        "fallback_email",
        f"fallback={r.get('used_fallback')}, reason={r.get('fallback_reason')}"
    )
    results.append(ok)

    # fallback_email — non-dict recruiter
    r = fallback_email({"recruiter": 42, "error": "bad type"})
    ok = r.get("used_fallback") is True and r.get("subject")
    (passed if ok else failed)("fallback_email (non-dict recruiter)", f"handled gracefully={ok}")
    results.append(ok)

    return all(results)


def test_routing_functions():
    """Test routing logic."""
    header("Test: Routing Functions")
    from src.langgraph_workflow import (
        route_after_validation, route_after_llm,
        route_after_parse, route_after_quality,
    )
    results = []

    # route_after_validation
    ok = route_after_validation({"error": None}) == "enrich_context"
    (passed if ok else failed)("route_after_validation (no error) → enrich_context")
    results.append(ok)

    ok = route_after_validation({"error": "bad input"}) == "fallback_email"
    (passed if ok else failed)("route_after_validation (error) → fallback_email")
    results.append(ok)

    # route_after_llm
    ok = route_after_llm({"error": None}) == "parse_response"
    (passed if ok else failed)("route_after_llm (success) → parse_response")
    results.append(ok)

    ok = route_after_llm({"error": "fail", "retry_count": 0}) == "call_llm"
    (passed if ok else failed)("route_after_llm (error, retry 0) → call_llm")
    results.append(ok)

    ok = route_after_llm({"error": "fail", "retry_count": 1}) == "call_llm"
    (passed if ok else failed)("route_after_llm (error, retry 1) → call_llm")
    results.append(ok)

    ok = route_after_llm({"error": "fail", "retry_count": 2}) == "fallback_email"
    (passed if ok else failed)("route_after_llm (error, retry 2) → fallback_email")
    results.append(ok)

    ok = route_after_llm({"error": "fail", "retry_count": 999}) == "fallback_email"
    (passed if ok else failed)("route_after_llm (error, retry 999) → fallback_email")
    results.append(ok)

    # route_after_parse
    ok = route_after_parse({"error": None}) == "quality_check"
    (passed if ok else failed)("route_after_parse (success) → quality_check")
    results.append(ok)

    ok = route_after_parse({"error": "parse fail"}) == "fallback_email"
    (passed if ok else failed)("route_after_parse (error) → fallback_email")
    results.append(ok)

    # route_after_quality
    ok = route_after_quality({"error": None}) == "apply_attachments"
    (passed if ok else failed)("route_after_quality (success) → apply_attachments")
    results.append(ok)

    ok = route_after_quality({"error": "quality fail"}) == "fallback_email"
    (passed if ok else failed)("route_after_quality (error) → fallback_email")
    results.append(ok)

    return all(results)


def test_api_key_validation():
    """Test that placeholder/invalid API keys are caught."""
    header("Test: API Key Validation")
    from src.langgraph_workflow import call_llm
    results = []

    original_key = os.environ.get("GROQ_API_KEY")

    # Placeholder key
    os.environ["GROQ_API_KEY"] = "your_groq_api_key_here"
    r = call_llm({"prompt": "test", "retry_count": 0})
    ok = r.get("retry_count") == 999 and "not configured" in r.get("error", "")
    (passed if ok else failed)("Rejects placeholder key", f"error={r.get('error')}")
    results.append(ok)

    # Short key
    os.environ["GROQ_API_KEY"] = "abc"
    r = call_llm({"prompt": "test", "retry_count": 0})
    ok = r.get("retry_count") == 999
    (passed if ok else failed)("Rejects short key (len < 10)", f"error={r.get('error')}")
    results.append(ok)

    # Empty key
    os.environ["GROQ_API_KEY"] = ""
    r = call_llm({"prompt": "test", "retry_count": 0})
    ok = r.get("retry_count") == 999 and "not set" in r.get("error", "")
    (passed if ok else failed)("Rejects empty key", f"error={r.get('error')}")
    results.append(ok)

    # Missing key
    del os.environ["GROQ_API_KEY"]
    r = call_llm({"prompt": "test", "retry_count": 0})
    ok = r.get("retry_count") == 999
    (passed if ok else failed)("Rejects missing key", f"error={r.get('error')}")
    results.append(ok)

    # Restore
    if original_key is not None:
        os.environ["GROQ_API_KEY"] = original_key

    return all(results)


def test_full_graph_fallback():
    """Test end-to-end graph with invalid API key → should fallback gracefully."""
    header("Test: Full Graph (Fallback Path)")
    from src.langgraph_workflow import build_email_graph

    original_key = os.environ.get("GROQ_API_KEY")
    os.environ["GROQ_API_KEY"] = "your_placeholder_key"

    graph = build_email_graph()
    results = []

    # Full data — should fallback due to bad key
    start = time.time()
    r = graph.invoke({
        "recruiter": SAMPLE_RECRUITER,
        "user_profile": SAMPLE_PROFILE,
    })
    elapsed = (time.time() - start) * 1000

    ok = r.get("used_fallback") is True
    (passed if ok else failed)("Fallback triggered", f"used_fallback={r.get('used_fallback')}")
    results.append(ok)

    ok = bool(r.get("fallback_reason"))
    (passed if ok else failed)("Fallback reason present", f"reason={r.get('fallback_reason', '')}")
    results.append(ok)

    ok = bool(r.get("subject")) and bool(r.get("body"))
    (passed if ok else failed)("Email content generated", f"subject_len={len(r.get('subject', ''))}, body_len={len(r.get('body', ''))}")
    results.append(ok)

    ok = r.get("error") is None
    (passed if ok else failed)("No terminal error", f"error={r.get('error')}")
    results.append(ok)

    info(f"Elapsed: {elapsed:.0f}ms (should be fast — no API call)")
    info(f"Subject: {r.get('subject', '')}")

    # Missing profile — should fallback via validation
    r2 = graph.invoke({"recruiter": SAMPLE_RECRUITER})
    ok = r2.get("used_fallback") is True and "user_profile" in r2.get("fallback_reason", "")
    (passed if ok else failed)("Missing profile → validation fallback", f"reason={r2.get('fallback_reason', '')}")
    results.append(ok)

    # Minimal data
    r3 = graph.invoke({
        "recruiter": MINIMAL_RECRUITER,
        "user_profile": MINIMAL_PROFILE,
    })
    ok = r3.get("used_fallback") is True and bool(r3.get("subject"))
    (passed if ok else failed)("Minimal data → fallback works", f"subject={r3.get('subject', '')[:40]}")
    results.append(ok)

    # With attachments
    r4 = graph.invoke({
        "recruiter": SAMPLE_RECRUITER,
        "user_profile": SAMPLE_PROFILE,
        "has_attachments": True,
    })
    ok = "attached" in r4.get("body", "").lower() or "resume" in r4.get("body", "").lower()
    (passed if ok else failed)("Attachments mention in fallback", f"body contains resume mention={ok}")
    results.append(ok)

    if original_key is not None:
        os.environ["GROQ_API_KEY"] = original_key

    return all(results)


def test_llm_generator_integration():
    """Test the LLMEmailGenerator wrapper class."""
    header("Test: LLMEmailGenerator Integration")
    from src.llm_generator import LLMEmailGenerator

    original_key = os.environ.get("GROQ_API_KEY")
    os.environ["GROQ_API_KEY"] = "your_placeholder_key"

    gen = LLMEmailGenerator()
    results = []

    # Single generate
    r = gen.generate(SAMPLE_RECRUITER, SAMPLE_PROFILE)
    ok = bool(r.get("subject")) and bool(r.get("body"))
    (passed if ok else failed)("generate() returns email", f"subject_len={len(r.get('subject', ''))}")
    results.append(ok)

    ok = r.get("used_fallback") is True
    (passed if ok else failed)("generate() reports fallback", f"used_fallback={r.get('used_fallback')}")
    results.append(ok)

    ok = bool(r.get("fallback_reason"))
    (passed if ok else failed)("generate() includes reason", f"reason={r.get('fallback_reason', '')[:50]}")
    results.append(ok)

    # Batch generate
    batch = gen.generate_batch(
        [SAMPLE_RECRUITER, MINIMAL_RECRUITER],
        SAMPLE_PROFILE,
    )
    ok = len(batch) == 2 and all(b["status"] == "generated" for b in batch)
    (passed if ok else failed)("generate_batch()", f"count={len(batch)}, all_generated={ok}")
    results.append(ok)

    # Preview
    preview = gen.preview_email(SAMPLE_RECRUITER, SAMPLE_PROFILE)
    ok = "SUBJECT:" in preview and "sarah.chen@techcorp.com" in preview
    (passed if ok else failed)("preview_email()", f"formatted={ok}")
    results.append(ok)

    # Templates
    templates = gen.get_available_templates()
    ok = templates == ["llm-generated"]
    (passed if ok else failed)("get_available_templates()", f"templates={templates}")
    results.append(ok)

    if original_key is not None:
        os.environ["GROQ_API_KEY"] = original_key

    return all(results)


def test_live_groq():
    """Test with actual Groq API call (only if --live flag is passed)."""
    header("Test: LIVE Groq API Call")
    from src.langgraph_workflow import build_email_graph

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key or api_key.startswith("your_") or len(api_key) < 10:
        warning("Skipped — no valid GROQ_API_KEY in .env")
        warning("Set a real key and run with: python test_langgraph_local.py --live")
        return None  # neutral — not a failure

    graph = build_email_graph()
    results = []

    start = time.time()
    r = graph.invoke({
        "recruiter": SAMPLE_RECRUITER,
        "user_profile": SAMPLE_PROFILE,
    })
    elapsed = (time.time() - start) * 1000

    used_fallback = r.get("used_fallback", False)
    fallback_reason = r.get("fallback_reason", "")
    is_quota_error = ("quota" in fallback_reason.lower() or "rate limit" in fallback_reason.lower()) if fallback_reason else False

    if not used_fallback:
        # LLM actually generated the email
        passed("LLM generated (not fallback)")
        results.append(True)

        ok = bool(r.get("subject")) and len(r.get("subject", "")) > 5
        (passed if ok else failed)("Subject generated", f"subject='{r.get('subject', '')[:60]}'")
        results.append(ok)

        ok = bool(r.get("body")) and len(r.get("body", "")) > 50
        (passed if ok else failed)("Body generated", f"body_len={len(r.get('body', ''))}")
        results.append(ok)

        info(f"Elapsed: {elapsed:.0f}ms")
        info(f"Subject: {r.get('subject', '')}")
        print()
        info("── Generated Email ──")
        for line in r.get("body", "").split("\n"):
            info(line)
        info("─────────────────────")

        # With attachments
        r2 = graph.invoke({
            "recruiter": SAMPLE_RECRUITER,
            "user_profile": SAMPLE_PROFILE,
            "has_attachments": True,
        })
        ok = "resume" in r2.get("body", "").lower() or "attached" in r2.get("body", "").lower()
        (passed if ok else failed)("Attachment mention added", f"present={ok}")
        results.append(ok)

    elif is_quota_error:
        # Quota exhausted — not a code bug, treat as soft pass
        warning("Groq API quota exhausted — fallback worked correctly")
        warning(f"Reason: {fallback_reason}")
        warning("Wait for quota reset or upgrade your plan, then retry")
        info(f"Elapsed: {elapsed:.0f}ms")

        # Verify the fallback still produced valid output
        ok = bool(r.get("subject")) and bool(r.get("body"))
        (passed if ok else failed)("Fallback email generated despite quota", f"subject='{r.get('subject', '')[:50]}'")
        results.append(ok)

        ok = r.get("error") is None
        (passed if ok else failed)("No terminal error", f"error={r.get('error')}")
        results.append(ok)

    else:
        # Actual LLM failure (not quota)
        failed("LLM generated (not fallback)", f"used_fallback={used_fallback}, reason={fallback_reason}")
        results.append(False)

    return all(results)


# ── Runner ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Test LangGraph email generation locally")
    parser.add_argument("--live", action="store_true", help="Run live Groq API test (requires valid key)")
    args = parser.parse_args()

    print(f"\n{Colors.BOLD}{'═' * 60}")
    print(f"  LangGraph Email Generation — Local Test Suite")
    print(f"{'═' * 60}{Colors.RESET}")

    test_results = {}

    test_results["Imports"] = test_imports()
    test_results["Graph Compilation"] = test_graph_compilation()
    test_results["Individual Nodes"] = test_individual_nodes()
    test_results["Routing Functions"] = test_routing_functions()
    test_results["API Key Validation"] = test_api_key_validation()
    test_results["Full Graph (Fallback)"] = test_full_graph_fallback()
    test_results["LLMEmailGenerator"] = test_llm_generator_integration()

    if args.live:
        test_results["Live Groq API"] = test_live_groq()

    # Summary
    print(f"\n{Colors.BOLD}{'═' * 60}")
    print(f"  Results")
    print(f"{'═' * 60}{Colors.RESET}")

    total = 0
    pass_count = 0
    fail_count = 0
    skip_count = 0

    for name, result in test_results.items():
        total += 1
        if result is True:
            pass_count += 1
            print(f"  {Colors.GREEN}✓{Colors.RESET}  {name}")
        elif result is False:
            fail_count += 1
            print(f"  {Colors.RED}✗{Colors.RESET}  {name}")
        else:
            skip_count += 1
            print(f"  {Colors.YELLOW}○{Colors.RESET}  {name} (skipped)")

    print(f"\n  {Colors.BOLD}{pass_count} passed{Colors.RESET}", end="")
    if fail_count:
        print(f"  {Colors.RED}{fail_count} failed{Colors.RESET}", end="")
    if skip_count:
        print(f"  {Colors.YELLOW}{skip_count} skipped{Colors.RESET}", end="")
    print()

    if not args.live:
        print(f"\n  {Colors.DIM}Tip: run with --live to test actual Groq API calls{Colors.RESET}")

    print()
    sys.exit(1 if fail_count > 0 else 0)


if __name__ == "__main__":
    main()
