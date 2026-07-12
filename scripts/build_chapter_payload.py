#!/usr/bin/env python3
"""Build the single runtime chapter payload consumed by the Vite app."""

from __future__ import annotations

import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "app/src/app_x/pdf"
MANIFEST_PATH = ROOT / "app/src/app_x/chapterManifest.json"
PUBLIC_PAYLOAD_DIR = ROOT / "app/public/app_x"
PAYLOAD_MANIFEST_PATH = ROOT / "app/src/app_x/chapterPayloadManifest.ts"


def main() -> None:
    chapter_manifest = json.loads(MANIFEST_PATH.read_text())
    chapters = [
        {
            "id": chapter["id"],
            "label": chapter["label"],
            "sections": json.loads(
                (PDF_DIR / f"chapter_{chapter['id']}.json").read_text(),
            ),
        }
        for chapter in chapter_manifest
    ]
    content_hash = hashlib.sha256(
        json.dumps(
            chapters,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode(),
    ).hexdigest()
    payload = {
        "schemaVersion": 1,
        "contentHash": f"sha256:{content_hash}",
        "chapters": chapters,
    }
    payload_filename = f"chapters.{content_hash[:16]}.json"
    output_path = PUBLIC_PAYLOAD_DIR / payload_filename

    PUBLIC_PAYLOAD_DIR.mkdir(parents=True, exist_ok=True)
    for stale_payload in PUBLIC_PAYLOAD_DIR.glob("chapters*.json"):
        stale_payload.unlink()

    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    PAYLOAD_MANIFEST_PATH.write_text(
        "\n".join(
            [
                "export const chapterPayloadContentHash = "
                f"'{payload['contentHash']}'",
                "export const chapterPayloadPath = "
                f"'app_x/{payload_filename}'",
                "",
            ],
        ),
    )


if __name__ == "__main__":
    main()
