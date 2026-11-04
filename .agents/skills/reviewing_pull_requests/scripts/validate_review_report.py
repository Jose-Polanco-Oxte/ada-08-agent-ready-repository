#!/usr/bin/env python3
"""
Validador determinista de reportes de revisión de Pull Requests.
Verifica que el archivo generado por el agente cumpla con la estructura
y secciones obligatorias definidas en la plantilla estándar.
"""

import sys
import os
import re

REQUIRED_SECTIONS = [
    "## Review Context",
    "## Requirements / Acceptance Criteria Reviewed",
    "## Test Evidence",
    "## MUST FIX",
    "## SHOULD FIX",
    "## OPTIONAL",
    "## Final Review Summary",
]

REQUIRED_PATTERNS = [
    r"Human decision required\s*:\s*(YES|NO)",
]


def validate_report(file_path: str) -> int:
    if not os.path.isfile(file_path):
        print(f"ERROR: El archivo no existe: {file_path}", file=sys.stderr)
        return 1

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"ERROR: No se pudo leer el archivo: {e}", file=sys.stderr)
        return 1

    missing_sections = []
    for section in REQUIRED_SECTIONS:
        if section not in content:
            missing_sections.append(section)

    if missing_sections:
        print(f"ERROR: Faltan secciones requeridas en el reporte:", file=sys.stderr)
        for sec in missing_sections:
            print(f"  - {sec}", file=sys.stderr)
        return 2

    missing_patterns = []
    for pattern in REQUIRED_PATTERNS:
        if not re.search(pattern, content, re.IGNORECASE):
            missing_patterns.append(pattern)

    if missing_patterns:
        print(f"ERROR: Falta el campo obligatorio 'Human decision required' en el resumen.", file=sys.stderr)
        return 3

    print("VALID: PR readiness review structure is complete.")
    return 0


def main():
    if len(sys.argv) < 2:
        print("Uso: python validate_review_report.py <ruta-al-reporte>", file=sys.stderr)
        sys.exit(1)

    report_path = sys.argv[1]
    exit_code = validate_report(report_path)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
