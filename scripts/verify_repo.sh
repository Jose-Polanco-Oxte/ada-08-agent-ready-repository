#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo " [VERIFY_REPO] Running Single Verification Pipeline"
echo "=================================================="

echo ""
echo "[1/3] Running automated unit tests..."
if command -v node >/dev/null 2>&1; then
    node --test tests/notes.test.mjs
else
    echo "ERROR: node is required to run tests." >&2
    exit 1
fi

echo ""
echo "[2/3] Running syntax and lint checks..."
node --check js/models.js js/storage.js js/app.js
echo "Syntax check: PASS"

echo ""
echo "[3/3] Running repository contract & invariant verification..."
if command -v python3 >/dev/null 2>&1; then
    python3 scripts/check_repo_contract.py
elif command -v python >/dev/null 2>&1; then
    python scripts/check_repo_contract.py
else
    echo "ERROR: python3 or python is required for repo contract check." >&2
    exit 1
fi

echo ""
echo "=================================================="
echo " VERIFY_REPO: PASS"
echo "=================================================="
exit 0
