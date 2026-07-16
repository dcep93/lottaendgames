#!/usr/bin/env python3
"""Audit committed KNN-vs-KP starts against a local five-piece Syzygy set.

Syzygy exposes WDL and DTZ, but not DTM. The manifest's DTM value is therefore
included in the report as recorded provenance and is not presented as a probe.
The browser application never imports this optional content-audit tool.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
from pathlib import Path
import sys
from typing import Any, Callable, Mapping


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "app/src/mate/data/two-knights-pawn-positions.json"
ALLOWED_TRANSFORMS = ("identity", "mirrorFile")
EXPECTED_PROVENANCE = {
    "provider": "Lichess tablebase API",
    "endpoint": "https://tablebase.lichess.ovh/standard",
    "verifiedOn": "2026-07-16",
    "wdlMetric": "Syzygy WDL",
    "dtzMetric": "Syzygy DTZ",
    "dtmMetric": "Lichess DTM record (not exposed by Syzygy)",
    "constructionMaximumPlies": 200,
}


class AuditError(RuntimeError):
    pass


@dataclass(frozen=True)
class ProbeResult:
    wdl: int
    dtz: int


def _expand_rank(rank: str) -> list[str]:
    squares: list[str] = []
    for token in rank:
        if token.isdigit():
            squares.extend("." for _ in range(int(token)))
        else:
            squares.append(token)
    if len(squares) != 8:
        raise AuditError(f"invalid FEN rank: {rank}")
    return squares


def _compress_rank(squares: list[str]) -> str:
    result: list[str] = []
    empty = 0
    for token in squares:
        if token == ".":
            empty += 1
            continue
        if empty:
            result.append(str(empty))
            empty = 0
        result.append(token)
    if empty:
        result.append(str(empty))
    return "".join(result)


def _mirror_file_square(square: str) -> str:
    if square == "-":
        return square
    if len(square) != 2 or square[0] not in "abcdefgh" or square[1] not in "12345678":
        raise AuditError(f"invalid FEN square: {square}")
    return f"{'hgfedcba'['abcdefgh'.index(square[0])]}{square[1]}"


def transform_fen(fen: str, transform_name: str) -> str:
    fields = fen.split()
    if len(fields) != 6:
        raise AuditError(f"FEN must contain six fields: {fen}")
    if transform_name == "identity":
        return fen
    if transform_name != "mirrorFile":
        raise AuditError(f"unsupported transform: {transform_name}")
    ranks = fields[0].split("/")
    if len(ranks) != 8:
        raise AuditError(f"FEN board must contain eight ranks: {fen}")
    fields[0] = "/".join(
        _compress_rank(list(reversed(_expand_rank(rank)))) for rank in ranks
    )
    fields[3] = _mirror_file_square(fields[3])
    return " ".join(fields)


def _validate_manifest(manifest: Mapping[str, Any]) -> None:
    if set(manifest) != {"syzygy", "provenance", "standard", "train"}:
        raise AuditError(
            "manifest must contain exactly syzygy, provenance, standard, and train"
        )
    syzygy = manifest.get("syzygy")
    if not isinstance(syzygy, Mapping) or syzygy != {
        "format": "five-piece",
        "classification": "win",
        "requiredProbe": 2,
    }:
        raise AuditError("manifest requires a five-piece unconditional Syzygy win probe")
    provenance = manifest.get("provenance")
    if not isinstance(provenance, Mapping) or dict(provenance) != EXPECTED_PROVENANCE:
        raise AuditError("manifest provenance does not match the recorded metric sources")
    for mode in ("standard", "train"):
        sources = manifest.get(mode)
        if not isinstance(sources, list) or not sources:
            raise AuditError(f"{mode} must contain at least one source")
        for source_index, source in enumerate(sources):
            label = f"{mode}[{source_index}]"
            if not isinstance(source, Mapping):
                raise AuditError(f"{label} must be an object")
            if set(source) != {"fen", "dtm", "dtz", "transformNames"}:
                raise AuditError(
                    f"{label} must contain exactly fen, dtm, dtz, and transformNames"
                )
            if not isinstance(source["fen"], str) or not source["fen"].strip():
                raise AuditError(f"{label}.fen must be a non-empty string")
            for metric in ("dtm", "dtz"):
                value = source[metric]
                if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                    raise AuditError(f"{label}.{metric} must be a positive integer")
            transforms = source["transformNames"]
            if not isinstance(transforms, list) or not transforms:
                raise AuditError(f"{label}.transformNames must be a non-empty array")
            if any(
                not isinstance(name, str) or name not in ALLOWED_TRANSFORMS
                for name in transforms
            ):
                raise AuditError(f"{label} has an unsupported transform")
            if len(set(transforms)) != len(transforms):
                raise AuditError(f"{label}.transformNames must not contain duplicates")


def audit_manifest(
    manifest: Mapping[str, Any],
    probe: Callable[[str], ProbeResult],
    *,
    tablebase_path: str = "injected-probe",
) -> dict[str, Any]:
    _validate_manifest(manifest)
    required_wdl = manifest["syzygy"]["requiredProbe"]
    positions: list[dict[str, Any]] = []
    for mode in ("standard", "train"):
        for source_index, source in enumerate(manifest[mode]):
            transforms = source.get("transformNames")
            for transform_name in transforms:
                fen = transform_fen(source["fen"], transform_name)
                result = probe(fen)
                context = f"{mode}[{source_index}] via {transform_name}"
                if result.wdl != required_wdl:
                    raise AuditError(
                        f"{context}: expected WDL {required_wdl}, probed {result.wdl}"
                    )
                if result.dtz != source["dtz"]:
                    raise AuditError(
                        f"{context}: expected DTZ {source['dtz']}, probed {result.dtz}"
                    )
                positions.append(
                    {
                        "clockBudget": {
                            "constructionPlyLimit": manifest["provenance"][
                                "constructionMaximumPlies"
                            ],
                            "dtmSlackPlies": manifest["provenance"][
                                "constructionMaximumPlies"
                            ]
                            - source["dtm"],
                            "dtzWithinHalfmoveBudget": source["dtz"]
                            <= 100 - int(fen.split()[4]),
                            "remainingHalfmovesBeforeDraw": 100
                            - int(fen.split()[4]),
                        },
                        "declaredDtm": source["dtm"],
                        "fen": fen,
                        "mode": mode,
                        "probeDtz": result.dtz,
                        "probeWdl": result.wdl,
                        "sourceIndex": source_index,
                        "transform": transform_name,
                    }
                )
    standard_count = len(manifest["standard"])
    train_count = len(manifest["train"])
    return {
        "dtmProvenance": {
            "metric": manifest["provenance"]["dtmMetric"],
            "provider": manifest["provenance"]["provider"],
            "verifiedOn": manifest["provenance"]["verifiedOn"],
        },
        "localAudit": {
            "performed": True,
            "tablebasePath": tablebase_path,
        },
        "positions": positions,
        "summary": (
            f"audited {standard_count} standard and {train_count} train "
            f"source positions; all WDL={required_wdl}"
        ),
    }


def _syzygy_probe(tablebase_path: Path) -> Callable[[str], ProbeResult]:
    try:
        import chess
        import chess.syzygy
    except ModuleNotFoundError as error:
        raise AuditError(
            "python-chess is required for this optional audit; install it outside the browser app"
        ) from error

    tablebase = chess.syzygy.open_tablebase(str(tablebase_path))

    def probe(fen: str) -> ProbeResult:
        board = chess.Board(fen)
        return ProbeResult(
            wdl=tablebase.probe_wdl(board),
            dtz=tablebase.probe_dtz(board),
        )

    setattr(probe, "close", tablebase.close)
    return probe


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tablebase", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args(argv)
    probe: Callable[[str], ProbeResult] | None = None
    try:
        if not args.tablebase.is_dir():
            raise AuditError(f"tablebase directory does not exist: {args.tablebase}")
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        probe = _syzygy_probe(args.tablebase)
        report = audit_manifest(
            manifest,
            probe,
            tablebase_path=str(args.tablebase.resolve()),
        )
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0
    except (AuditError, OSError, json.JSONDecodeError) as error:
        print(f"audit failed: {error}", file=sys.stderr)
        return 1
    finally:
        close = getattr(probe, "close", None)
        if close is not None:
            close()


if __name__ == "__main__":
    raise SystemExit(main())
