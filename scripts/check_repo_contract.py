#!/usr/bin/env python3
"""
scripts/check_repo_contract.py
Deterministic repository readiness and architectural contract verification.
"""

from pathlib import Path
import re
import sys

def main():
    root = Path(__file__).resolve().parent.parent
    errors = []

    print("[CONTRACT] Checking required essential files...")
    required_files = [
        "AGENTS.md",
        "README.md",
        "REQUIREMENTS.md",
        "SPEC.md",
        "ARCHITECTURE.md",
        "TASKS.md",
        "docs/REPO_MAP.md",
        "package.json",
        "js/models.js",
        "js/storage.js",
        "tests/notes.test.mjs"
    ]

    for rel_path in required_files:
        full_path = root / rel_path
        if not full_path.exists():
            errors.append(f"Missing required file: {rel_path}")

    # Check that SPEC.md references requirement IDs
    spec_path = root / "SPEC.md"
    if spec_path.exists():
        spec_text = spec_path.read_text(encoding="utf-8")
        required_req_ids = ["FR-01", "FR-02", "FR-03", "FR-04", "AC-04"]
        for req_id in required_req_ids:
            if req_id not in spec_text:
                errors.append(f"SPEC.md is missing reference to requirement ID: {req_id}")

    # Check that AGENTS.md includes standard commands
    agents_path = root / "AGENTS.md"
    if agents_path.exists():
        agents_text = agents_path.read_text(encoding="utf-8")
        required_commands = ["verify_repo", "test", "node --check"]
        for cmd in required_commands:
            if cmd not in agents_text:
                errors.append(f"AGENTS.md is missing mention of standard command: {cmd}")

    # Check that results directory exists
    results_dir = root / "results"
    if not results_dir.exists() or not results_dir.is_dir():
        errors.append("Directory 'results/' does not exist.")

    # Check that no sensitive files or environment secrets exist
    sensitive_patterns = [".env", ".env.local", "*.pem", "*.key", "id_rsa"]
    for pattern in sensitive_patterns:
        for match in root.glob(pattern):
            errors.append(f"Sensitive file found in repository: {match.name}")

    # Check architectural invariant: No deletion methods allowed in storage layer
    storage_path = root / "js" / "storage.js"
    if storage_path.exists():
        storage_code = storage_path.read_text(encoding="utf-8")
        prohibited_methods = ["deleteNote", "removeNote", "clearNotes", "destroyNote", "delete(", "remove("]
        for prob in prohibited_methods:
            if re.search(r'\b' + re.escape(prob), storage_code):
                errors.append(f"Architectural invariant violation in js/storage.js: prohibited method pattern '{prob}' found.")

    if errors:
        print("REPO_CONTRACT: FAIL")
        for err in errors:
            print(f"  - ERROR: {err}")
        sys.exit(1)

    print("REPO_CONTRACT: PASS (All repository contracts verified)")
    sys.exit(0)

if __name__ == "__main__":
    main()
