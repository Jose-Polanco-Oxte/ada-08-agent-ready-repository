# scripts/verify_repo.ps1
# Deterministic verification runner for Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " [VERIFY_REPO] Running Single Verification Pipeline" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Running automated unit tests..." -ForegroundColor Yellow
& node --test tests/notes.test.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed!"
    exit 1
}

Write-Host "`n[2/3] Running syntax and lint checks..." -ForegroundColor Yellow
& node --check js/models.js js/storage.js js/app.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Syntax check failed!"
    exit 1
}
Write-Host "Syntax check: PASS" -ForegroundColor Green

Write-Host "`n[3/3] Running repository contract & invariant verification..." -ForegroundColor Yellow
& python scripts/check_repo_contract.py
if ($LASTEXITCODE -ne 0) {
    Write-Error "Repository contract checks failed!"
    exit 1
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " VERIFY_REPO: PASS" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
exit 0
