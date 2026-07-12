#!/usr/bin/env python3
"""Build the generated chapter payloads consumed by the Vite app."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TSX = ROOT / "app/node_modules/.bin/tsx"
SCRIPT = ROOT / "scripts/build_chapter_payload.ts"


def main() -> None:
    subprocess.run([str(TSX), str(SCRIPT)], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
