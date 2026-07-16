import importlib.util
import json
from pathlib import Path
import sys
import unittest


SCRIPT_PATH = Path(__file__).with_name("audit_two_knights_pawn.py")
SPEC = importlib.util.spec_from_file_location("audit_two_knights_pawn", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


class TwoKnightsPawnAuditTests(unittest.TestCase):
    def setUp(self):
        manifest_path = (
            Path(__file__).parents[1]
            / "app/src/mate/data/two-knights-pawn-positions.json"
        )
        self.manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    def test_file_mirror_is_an_involution_and_preserves_fen_fields(self):
        fen = self.manifest["standard"][0]["fen"]
        mirrored = AUDIT.transform_fen(fen, "mirrorFile")

        self.assertEqual(AUDIT.transform_fen(mirrored, "mirrorFile"), fen)
        self.assertEqual(mirrored.split()[1:], fen.split()[1:])
        self.assertNotEqual(mirrored.split()[0], fen.split()[0])

    def test_stable_report_audits_every_declared_source_and_transform(self):
        def probe(fen):
            pawn_rank = next(
                rank
                for rank, row in zip(range(8, 0, -1), fen.split()[0].split("/"))
                if "p" in row
            )
            return AUDIT.ProbeResult(wdl=2, dtz=1 if pawn_rank == 2 else 46)

        first = AUDIT.audit_manifest(self.manifest, probe)
        second = AUDIT.audit_manifest(self.manifest, probe)
        expected = {
            "dtmProvenance": {
                "metric": "Lichess DTM record (not exposed by Syzygy)",
                "provider": "Lichess tablebase API",
                "verifiedOn": "2026-07-16",
            },
            "localAudit": {
                "performed": True,
                "tablebasePath": "injected-probe",
            },
            "positions": [
                {
                    "clockBudget": {
                        "constructionPlyLimit": 200,
                        "dtmSlackPlies": 27,
                        "dtzWithinHalfmoveBudget": True,
                        "remainingHalfmovesBeforeDraw": 100,
                    },
                    "declaredDtm": 173,
                    "fen": "4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1",
                    "mode": "standard",
                    "probeDtz": 46,
                    "probeWdl": 2,
                    "sourceIndex": 0,
                    "transform": "identity",
                },
                {
                    "clockBudget": {
                        "constructionPlyLimit": 200,
                        "dtmSlackPlies": 27,
                        "dtzWithinHalfmoveBudget": True,
                        "remainingHalfmovesBeforeDraw": 100,
                    },
                    "declaredDtm": 173,
                    "fen": "3k4/7p/8/8/8/8/8/1N1K2N1 w - - 0 1",
                    "mode": "standard",
                    "probeDtz": 46,
                    "probeWdl": 2,
                    "sourceIndex": 0,
                    "transform": "mirrorFile",
                },
                {
                    "clockBudget": {
                        "constructionPlyLimit": 200,
                        "dtmSlackPlies": 199,
                        "dtzWithinHalfmoveBudget": True,
                        "remainingHalfmovesBeforeDraw": 100,
                    },
                    "declaredDtm": 1,
                    "fen": "7k/8/5NKN/8/8/8/p7/8 w - - 0 1",
                    "mode": "train",
                    "probeDtz": 1,
                    "probeWdl": 2,
                    "sourceIndex": 0,
                    "transform": "identity",
                },
                {
                    "clockBudget": {
                        "constructionPlyLimit": 200,
                        "dtmSlackPlies": 199,
                        "dtzWithinHalfmoveBudget": True,
                        "remainingHalfmovesBeforeDraw": 100,
                    },
                    "declaredDtm": 1,
                    "fen": "k7/8/NKN5/8/8/8/7p/8 w - - 0 1",
                    "mode": "train",
                    "probeDtz": 1,
                    "probeWdl": 2,
                    "sourceIndex": 0,
                    "transform": "mirrorFile",
                },
            ],
            "summary": "audited 1 standard and 1 train source positions; all WDL=2",
        }
        self.assertEqual(first, expected)
        self.assertEqual(second, expected)
        self.assertEqual(
            json.dumps(first, indent=2, sort_keys=True),
            json.dumps(second, indent=2, sort_keys=True),
        )

    def test_audit_rejects_nonwinning_probe_and_dtz_mismatch(self):
        with self.assertRaisesRegex(AUDIT.AuditError, "expected WDL 2, probed 1"):
            AUDIT.audit_manifest(
                self.manifest,
                lambda _fen: AUDIT.ProbeResult(wdl=1, dtz=46),
            )

        with self.assertRaisesRegex(AUDIT.AuditError, "expected DTZ 46, probed 45"):
            AUDIT.audit_manifest(
                self.manifest,
                lambda _fen: AUDIT.ProbeResult(wdl=2, dtz=45),
            )

        with self.assertRaisesRegex(AUDIT.AuditError, "expected DTZ 46, probed -46"):
            AUDIT.audit_manifest(
                self.manifest,
                lambda _fen: AUDIT.ProbeResult(wdl=2, dtz=-46),
            )

    def test_manifest_schema_is_exact_and_typed(self):
        malformed = json.loads(json.dumps(self.manifest))
        malformed["standard"][0]["dtm"] = True
        with self.assertRaisesRegex(AUDIT.AuditError, "dtm must be a positive integer"):
            AUDIT.audit_manifest(
                malformed,
                lambda _fen: AUDIT.ProbeResult(wdl=2, dtz=46),
            )

        malformed = json.loads(json.dumps(self.manifest))
        malformed["provenance"]["provider"] = "unknown"
        with self.assertRaisesRegex(AUDIT.AuditError, "provenance"):
            AUDIT.audit_manifest(
                malformed,
                lambda _fen: AUDIT.ProbeResult(wdl=2, dtz=46),
            )

        malformed = json.loads(json.dumps(self.manifest))
        malformed["train"][0]["transformNames"] = ["identity", "identity"]
        with self.assertRaisesRegex(AUDIT.AuditError, "must not contain duplicates"):
            AUDIT.audit_manifest(
                malformed,
                lambda _fen: AUDIT.ProbeResult(wdl=2, dtz=1),
            )


if __name__ == "__main__":
    unittest.main()
